import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  DsCombobox,
  DsComboboxGroup,
  DsComboboxItem,
  DsComboboxList,
  DsDialog,
  DsDialogContent,
  DsDialogTitle,
  DsPresence,
  DsVisuallyHidden,
  isBrowser,
  uniqueId,
} from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';
import { KbdComponent } from '../kbd/kbd';
import { bestCommandScore } from './command-score';

/** One action in a `ds-command-palette`. */
export interface CommandPaletteCommand {
  id: string;
  label: string;
  /** Heading the command is listed under. */
  group?: string;
  /** Extra words that should find this command ("settings" for "Preferences"). */
  keywords?: string[];
  /** Second line under the label. */
  description?: string;
  /** Built-in icon name. */
  icon?: string;
  /** Keys shown as a hint, e.g. `['⌘', 'S']`. Display only. */
  shortcut?: string[];
  disabled?: boolean;
  /** Runs after the palette closes. You can also listen to `(run)`. */
  onSelect?: () => void;
}

interface CommandGroup {
  heading: string;
  headingId: string;
  commands: CommandPaletteCommand[];
}

/**
 * A searchable list of actions in a modal dialog, opened with ⌘K (macOS) or Ctrl+K. Type to
 * filter (fuzzy and ranked, matching labels and keywords), ArrowUp/ArrowDown to move (wrapping,
 * skipping disabled commands), Enter or a click to run, Escape to close.
 *
 * ```html
 * <ds-command-palette [commands]="commands" (run)="log($event.id)" />
 * ```
 *
 * Built on `DsDialog` / `DsDialogContent` (a native `<dialog>`) and the combobox listbox
 * parts (`dsComboboxList`, `dsComboboxItem`): the input keeps focus and points at the
 * highlighted command through `aria-activedescendant`.
 *
 * Differences from React: the type is `CommandPaletteCommand` (React's `Command`), and
 * besides each command's `onSelect` the palette emits `(run)` with the command; the dialog stays
 * in place in the DOM (top layer) instead of a portal. Options mark the highlighted command with
 * `data-highlighted`; `aria-selected` stays false (nothing is selected, commands run).
 */
@Component({
  selector: 'ds-command-palette',
  imports: [
    DsDialog,
    DsDialogContent,
    DsDialogTitle,
    DsPresence,
    DsVisuallyHidden,
    DsCombobox,
    DsComboboxList,
    DsComboboxGroup,
    DsComboboxItem,
    IconComponent,
    KbdComponent,
  ],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class CommandPaletteComponent {
  /** The actions to search. */
  readonly commands = input.required<CommandPaletteCommand[]>();
  /** Whether the palette is open. Two-way bindable: `[(open)]`. */
  readonly open = model(false);
  readonly placeholder = input('Type a command or search…');
  /** Shown when nothing matches. */
  readonly emptyMessage = input('No results');
  /**
   * Key that toggles the palette together with ⌘ (macOS) or Ctrl (elsewhere). `false` disables
   * the shortcut. @default 'k'
   */
  readonly hotkey = input<string | false>('k');
  /** Accessible name of the dialog, the input and the list. */
  readonly label = input('Command palette');
  /** A command ran (Enter or click), after the palette closed. */
  readonly run = output<CommandPaletteCommand>();

  protected readonly query = signal('');
  private readonly combobox = viewChild(DsCombobox);
  private readonly baseId = uniqueId('ds-command-palette-');

  /** Matches grouped in first-seen group order, each group sorted by score while searching. */
  protected readonly groups = computed<CommandGroup[]>(() => {
    const query = this.query();
    const byGroup = new Map<string, { command: CommandPaletteCommand; score: number }[]>();
    for (const command of this.commands()) {
      const score = bestCommandScore(command.label, command.keywords, query);
      if (score <= 0) continue;
      const key = command.group ?? '';
      byGroup.set(key, [...(byGroup.get(key) ?? []), { command, score }]);
    }
    return [...byGroup.entries()].map(([heading, results], index) => ({
      heading,
      headingId: `${this.baseId}-group-${index}`,
      commands: (query ? [...results].sort((a, b) => b.score - a.score) : results).map(
        (result) => result.command,
      ),
    }));
  });
  /** Matching commands that can run, in display order. */
  protected readonly runnable = computed(() =>
    this.groups()
      .flatMap((group) => group.commands)
      .filter((command) => !command.disabled),
  );
  protected readonly activeDescendant = computed(() => {
    const combobox = this.combobox();
    const highlighted = combobox?.highlighted();
    return combobox && highlighted != null ? combobox.optionId(highlighted) : null;
  });

  constructor() {
    // Something is always highlighted while there are matches: the first one by default.
    effect(() => {
      const combobox = this.combobox();
      if (!combobox) return;
      const runnable = this.runnable();
      const highlighted = combobox.highlighted();
      if (!runnable.some((command) => command.id === highlighted))
        untracked(() => combobox.highlighted.set(runnable[0]?.id ?? null));
    });

    if (isBrowser()) {
      const doc = inject(DOCUMENT);
      const onKeyDown = (event: KeyboardEvent) => {
        const hotkey = this.hotkey();
        if (!hotkey || !(event.metaKey || event.ctrlKey)) return;
        if (event.key.toLowerCase() !== hotkey.toLowerCase()) return;
        event.preventDefault();
        this.setOpen(!this.open());
      };
      doc.addEventListener('keydown', onKeyDown);
      inject(DestroyRef).onDestroy(() => doc.removeEventListener('keydown', onKeyDown));
    }
  }

  protected setOpen(open: boolean) {
    this.open.set(open);
    if (!open) this.query.set('');
  }

  protected onInput(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
    // A new search starts at its best match.
    this.combobox()?.highlighted.set(this.runnable()[0]?.id ?? null);
  }

  protected onKeyDown(event: KeyboardEvent) {
    const combobox = this.combobox();
    if (!combobox) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      combobox.move(event.key === 'ArrowDown' ? 'next' : 'previous');
    } else if (event.key === 'Enter') {
      const command = this.runnable().find((entry) => entry.id === combobox.highlighted());
      if (!command) return;
      event.preventDefault();
      this.runCommand(command);
    }
  }

  protected runCommand(command: CommandPaletteCommand) {
    if (command.disabled) return;
    this.setOpen(false);
    // Let the dialog close (and focus return) before the command runs.
    setTimeout(() => {
      command.onSelect?.();
      this.run.emit(command);
    }, 0);
  }
}
