import {
  afterNextRender,
  booleanAttribute,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  signal,
  untracked,
} from '@angular/core';
import { injectButtonType } from '../utils/button';
import { byDocumentOrder, dataFlag, openState } from '../utils/dom';
import { FloatingAnchor } from '../utils/floating';
import { DsFloating, DsFloatingContext, injectFloatingLayer } from '../utils/floating.directive';
import { uniqueId } from '../utils/id';
import { findNextIndex, NavigationKey } from '../utils/navigation';
import { FLOATING_INPUTS } from '../popover/popover.directive';

/** Decides whether an item matches the typed text. Return true to show it. */
export type ComboboxFilter = (itemText: string, inputValue: string) => boolean;

const normalise = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Case-insensitive "contains", ignoring accents. */
export const defaultComboboxFilter: ComboboxFilter = (itemText, inputValue) =>
  normalise(itemText).includes(normalise(inputValue.trim()));

const idPart = (value: string) =>
  value.replace(/[^\w-]/g, (character) => `_${character.charCodeAt(0)}`);

/**
 * A text input with a list of suggestions (WAI-ARIA APG Combobox, list autocomplete): typing
 * filters, the arrow keys move the highlight (`aria-activedescendant`, focus stays in the
 * input), Enter selects, Escape closes and then clears. Single or multiple. The root renders
 * nothing; put it on an `<ng-container>` or any wrapper.
 *
 * ```html
 * <ng-container dsCombobox #fruit="dsCombobox" [(value)]="choice">
 *   <label for="fruit">Fruit</label>
 *   <div dsComboboxAnchor>
 *     <input id="fruit" dsComboboxInput />
 *     <button dsComboboxTrigger>▾</button>
 *   </div>
 *   <div *dsPresence="fruit.isOpen()" dsComboboxContent align="start" aria-label="Fruit">
 *     @for (name of names; track name) {
 *       <div dsComboboxItem [value]="name">{{ name }}</div>
 *     }
 *     <div dsComboboxEmpty>No fruit found</div>
 *   </div>
 * </ng-container>
 * ```
 *
 * Differences from React: the single and multiple selections are two models, `value`
 * (`string | null`) and `values` (`string[]`), so both stay typed; filtered-out items stay in
 * the DOM with `hidden` (style `[hidden] { display: none }` if you set `display` on items);
 * the list stays in place in the DOM (top layer through `popover="manual"`) instead of a
 * portal; `dsComboboxContent` uses the shared floating defaults, so pass `align="start"` for
 * React's alignment; `dsComboboxList` is an inline (non-floating) listbox, and items emit
 * `(picked)` when chosen, for command palettes.
 */
@Directive({ selector: '[dsCombobox]', exportAs: 'dsCombobox', providers: [DsFloatingContext] })
export class DsCombobox {
  /** The selected value (single selection). Two-way bindable: `[(value)]`. */
  readonly value = model<string | null>(null);
  /** The selected values (with `multiple`). Two-way bindable: `[(values)]`. */
  readonly values = model<string[]>([]);
  /** Select several items; the input clears after each pick and the list stays open. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** The typed text. Two-way bindable; changes on every keystroke and when a pick fills it. */
  readonly inputValue = model('');
  /** Whether the list is open. Two-way bindable: `[(open)]`. */
  readonly open = model(false);
  /** How items match the typed text. `false` turns filtering off (for server-side search). */
  readonly filter = input<ComboboxFilter | false>(defaultComboboxFilter);
  /** Disables the input and keeps the list closed. */
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly listboxId = uniqueId('ds-combobox-');
  /** The list is open and the combobox is enabled. */
  readonly isOpen = computed(() => this.open() && !this.disabled());
  /** The selection as a list, whatever the mode. */
  readonly selection = computed<readonly string[]>(() => {
    if (this.multiple()) return this.values();
    const value = this.value();
    return value === null ? [] : [value];
  });
  /** Value of the highlighted item (the input's active descendant). */
  readonly highlighted = signal<string | null>(null);
  /** True while the text came from typing (filtering applies), false right after a pick. */
  readonly filtering = signal(false);

  readonly input = signal<HTMLElement | null>(null);
  readonly anchor = signal<HTMLElement | null>(null);
  readonly triggers = signal<readonly HTMLElement[]>([]);
  readonly listbox = signal<HTMLElement | null>(null);
  readonly items = signal<readonly DsComboboxItem[]>([]);
  /** No item matches (or there are none): `dsComboboxEmpty` shows. */
  readonly empty = computed(() => !this.items().some((item) => item.visible()));
  /** Set when the list is opened from the keyboard: which item to highlight once it renders. */
  readonly pendingHighlight = signal<'first' | 'last' | null>(null);

  constructor() {
    // Keep the highlight on a visible item, highlight the first match while typing, and apply
    // a keyboard open's pending highlight once items have rendered.
    effect(() => {
      if (!this.isOpen()) {
        this.pendingHighlight.set(null);
        return;
      }
      const visible = this.visibleItems();
      const enabled = visible.filter((item) => !item.disabled());
      const pending = this.pendingHighlight();
      const highlighted = this.highlighted();
      // Tracked directly: typing that keeps every item visible must still highlight a match.
      const typing = this.filtering() && this.inputValue() !== '';
      untracked(() => {
        if (pending) {
          if (visible.length === 0) return;
          const target = pending === 'first' ? enabled[0] : enabled[enabled.length - 1];
          this.pendingHighlight.set(null);
          this.highlighted.set(target?.value() ?? null);
          return;
        }
        if (!visible.some((item) => item.value() === highlighted)) {
          const first = typing ? enabled[0] : undefined;
          this.highlighted.set(first?.value() ?? null);
        }
      });
    });

    // Keep the highlighted item in view while arrowing through a long list.
    effect(() => {
      const highlighted = this.highlighted();
      if (!this.isOpen() || highlighted === null) return;
      untracked(() =>
        this.items()
          .find((item) => item.value() === highlighted)
          ?.element.scrollIntoView?.({ block: 'nearest' }),
      );
    });
  }

  /** Id of the item with this value, for `aria-activedescendant`. */
  optionId(value: string) {
    return `${this.listboxId}-option-${idPart(value)}`;
  }

  /** Visible items in document order. */
  visibleItems() {
    return this.items()
      .filter((item) => item.visible())
      .sort((a, b) => byDocumentOrder(a.element, b.element));
  }

  setOpen(open: boolean) {
    this.open.set(open);
  }

  /** Typed text: filtering applies. */
  setInputValue(value: string) {
    this.filtering.set(true);
    this.inputValue.set(value);
  }

  /** Picks an item: toggles it (multiple) or selects it, fills the input and closes (single). */
  select(item: DsComboboxItem) {
    if (item.disabled()) return;
    const value = item.value();
    item.picked.emit(value);
    this.filtering.set(false);
    if (this.multiple()) {
      const values = this.values();
      this.values.set(
        values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value],
      );
      this.inputValue.set('');
    } else {
      this.value.set(value);
      this.inputValue.set(item.label());
      this.setOpen(false);
    }
  }

  /** Moves the highlight over the visible, enabled items (wrapping). */
  move(step: NavigationKey) {
    const visible = this.visibleItems();
    const current = visible.findIndex((item) => item.value() === this.highlighted());
    const next = findNextIndex(
      visible.map((item) => ({ label: item.label(), disabled: item.disabled() })),
      current,
      step,
      { loop: true },
    );
    this.highlighted.set(next === -1 ? null : visible[next].value());
  }

  register(item: DsComboboxItem) {
    this.items.update((items) => [...items, item]);
  }
  unregister(item: DsComboboxItem) {
    this.items.update((items) => items.filter((entry) => entry !== item));
  }

  /** Whether a pointer or focus target belongs to the input, its anchor or a trigger. */
  isOwnTarget(target: EventTarget | null) {
    if (!(target instanceof Node)) return false;
    return [this.input(), this.anchor(), ...this.triggers()].some((element) =>
      element?.contains(target),
    );
  }
}

/** The box the list is positioned against (the input's frame). Defaults to the input itself. */
@Directive({ selector: '[dsComboboxAnchor]' })
export class DsComboboxAnchor implements OnInit, OnDestroy {
  private readonly root = inject(DsCombobox);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  ngOnInit() {
    this.root.anchor.set(this.element);
  }
  ngOnDestroy() {
    if (this.root.anchor() === this.element) this.root.anchor.set(null);
  }
}

/**
 * The text input: `role="combobox"`. Owns keyboard navigation through `aria-activedescendant`:
 * ArrowDown/ArrowUp open the list (highlighting the first or last item) and move the
 * highlight, Alt+ArrowDown only opens, Enter picks, Escape closes and then clears, Tab closes.
 */
@Directive({
  selector: 'input[dsComboboxInput]',
  host: {
    role: 'combobox',
    autocomplete: 'off',
    'aria-autocomplete': 'list',
    '[attr.aria-expanded]': 'root.isOpen()',
    '[attr.aria-controls]': 'root.isOpen() ? root.listboxId : null',
    '[attr.aria-activedescendant]': 'activeDescendant()',
    '[attr.data-state]': 'state()',
    '[disabled]': 'root.disabled()',
    '[value]': 'root.inputValue()',
    '(input)': 'onInput($event)',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeyDown($event)',
    '(blur)': 'root.setOpen(false)',
  },
})
export class DsComboboxInput implements OnInit, OnDestroy {
  protected readonly root = inject(DsCombobox);
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  protected readonly state = computed(() => openState(this.root.isOpen()));
  protected readonly activeDescendant = computed(() => {
    const highlighted = this.root.highlighted();
    return this.root.isOpen() && highlighted !== null ? this.root.optionId(highlighted) : null;
  });

  ngOnInit() {
    this.root.input.set(this.element);
  }
  ngOnDestroy() {
    if (this.root.input() === this.element) this.root.input.set(null);
  }

  protected onInput(event: Event) {
    this.root.setInputValue((event.target as HTMLInputElement).value);
    this.root.setOpen(true);
  }

  protected onClick(event: MouseEvent) {
    if (!event.defaultPrevented) this.root.setOpen(true);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const root = this.root;
    const open = root.isOpen();
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!open) {
          // The list renders on open and the root applies the highlight (Alt+Down only opens).
          if (!event.altKey)
            root.pendingHighlight.set(event.key === 'ArrowDown' ? 'first' : 'last');
          root.setOpen(true);
          return;
        }
        if (!event.altKey) root.move(event.key === 'ArrowDown' ? 'next' : 'previous');
        return;
      }
      case 'Enter': {
        const highlighted = root.highlighted();
        if (!open || highlighted === null) return;
        const item = root.visibleItems().find((entry) => entry.value() === highlighted);
        if (item && !item.disabled()) {
          event.preventDefault();
          root.select(item);
        }
        return;
      }
      case 'Escape': {
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          root.setOpen(false);
        } else if (root.inputValue()) {
          event.preventDefault();
          root.setInputValue('');
        }
        return;
      }
      case 'Tab':
        root.setOpen(false);
        return;
    }
  }
}

/**
 * Optional button that toggles the list. Not in the tab order, and it keeps focus in the input.
 * Named "Show suggestions" / "Hide suggestions" unless you give it an `aria-label`.
 */
@Directive({
  selector: 'button[dsComboboxTrigger]',
  host: {
    tabindex: '-1',
    '[attr.aria-label]': 'label()',
    '[attr.aria-expanded]': 'root.isOpen()',
    '[attr.aria-controls]': 'root.isOpen() ? root.listboxId : null',
    '[attr.data-state]': 'state()',
    '[disabled]': 'root.disabled()',
    '(mousedown)': '$event.preventDefault()',
    '(click)': 'toggle($event)',
  },
})
export class DsComboboxTrigger implements OnInit, OnDestroy {
  protected readonly root = inject(DsCombobox);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Accessible name. @default 'Show suggestions' / 'Hide suggestions' */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  protected readonly label = computed(
    () => this.ariaLabel() ?? (this.root.isOpen() ? 'Hide suggestions' : 'Show suggestions'),
  );
  protected readonly state = computed(() => openState(this.root.isOpen()));

  constructor() {
    injectButtonType();
  }

  ngOnInit() {
    this.root.triggers.update((triggers) => [...triggers, this.element]);
  }
  ngOnDestroy() {
    this.root.triggers.update((triggers) => triggers.filter((entry) => entry !== this.element));
  }

  protected toggle(event: MouseEvent) {
    if (event.defaultPrevented) return;
    this.root.setOpen(!this.root.isOpen());
    this.root.input()?.focus();
  }
}

/** Shared by the floating and the inline listbox: registration with the root. */
@Directive()
abstract class ComboboxListboxBase implements OnInit, OnDestroy {
  protected readonly root = inject(DsCombobox);
  protected readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly state = computed(() => openState(this.root.isOpen()));
  ngOnInit() {
    this.root.listbox.set(this.element);
  }
  ngOnDestroy() {
    if (this.root.listbox() === this.element) this.root.listbox.set(null);
  }
}

const LISTBOX_HOST = {
  role: 'listbox',
  '[id]': 'root.listboxId',
  '[attr.aria-multiselectable]': 'root.multiple() || null',
  '[attr.data-state]': 'state()',
  // Clicking inside the list must not blur the input.
  '(mousedown)': '$event.preventDefault()',
};

/**
 * The suggestion list: `role="listbox"`, in the top layer, positioned against the anchor (or
 * the input), closed by Escape and outside clicks. Render it with
 * `*dsPresence="combobox.isOpen()"` so it can animate out.
 */
@Directive({
  selector: '[dsComboboxContent]',
  hostDirectives: [{ directive: DsFloating, inputs: [...FLOATING_INPUTS] }],
  host: { ...LISTBOX_HOST, 'data-pada-layer': '' },
})
export class DsComboboxContent extends ComboboxListboxBase {
  constructor() {
    super();
    const root = this.root;
    injectFloatingLayer({
      open: root.isOpen,
      anchor: (): FloatingAnchor | null => root.anchor() ?? root.input(),
      dismiss: () => ({
        onDismiss: () => root.setOpen(false),
        onInteractOutside: (event) => {
          if (root.isOwnTarget(event.target)) event.preventDefault();
        },
      }),
    });
  }
}

/**
 * An inline listbox that is always rendered (no floating, no dismiss), for lists that live in
 * a panel of their own, such as a command palette.
 */
@Directive({ selector: '[dsComboboxList]', host: LISTBOX_HOST })
export class DsComboboxList extends ComboboxListboxBase {}

/**
 * One suggestion: `role="option"`. Hidden (`hidden`) while it does not match the typed text.
 * Emits `picked` when chosen with a click or Enter.
 */
@Directive({
  selector: '[dsComboboxItem]',
  host: {
    role: 'option',
    '[id]': 'root.optionId(value())',
    '[hidden]': '!visible()',
    '[attr.aria-selected]': 'isSelected()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.data-value]': 'value()',
    '[attr.data-state]': 'isSelected() ? "checked" : "unchecked"',
    '[attr.data-highlighted]': 'flag(isHighlighted())',
    '[attr.data-disabled]': 'flag(disabled())',
    '(pointermove)': 'highlight()',
    '(click)': 'pick($event)',
  },
})
export class DsComboboxItem implements OnInit, OnDestroy {
  protected readonly root = inject(DsCombobox);
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** The value selected by this item. */
  readonly value = input.required<string>();
  /** Text used for filtering and for filling the input. Defaults to the item's text content. */
  readonly textValue = input<string>();
  /** Skipped by the keyboard and not selectable. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The item was chosen (click or Enter). Emits its value. */
  readonly picked = output<string>();

  // The text content is read after the first render (interpolations fill it in late).
  private readonly rendered = signal(0);
  readonly visible = computed(() => {
    this.rendered();
    const filter = this.root.filter();
    if (!filter || !this.root.filtering()) return true;
    return filter(this.label(), this.root.inputValue());
  });
  readonly isSelected = computed(() => this.root.selection().includes(this.value()));
  readonly isHighlighted = computed(() => this.root.highlighted() === this.value());
  protected readonly flag = dataFlag;

  constructor() {
    afterNextRender(() => this.rendered.update((count) => count + 1));
  }

  /** The item's text, for filtering, type-ahead and filling the input. */
  label(): string {
    return this.textValue() ?? (this.element.textContent?.trim() || this.value());
  }

  ngOnInit() {
    this.root.register(this);
  }
  ngOnDestroy() {
    this.root.unregister(this);
  }

  protected highlight() {
    if (!this.disabled() && !this.isHighlighted()) this.root.highlighted.set(this.value());
  }

  protected pick(event: MouseEvent) {
    if (!event.defaultPrevented && !this.disabled()) this.root.select(this);
  }
}

/** Groups items under a heading. Point `aria-labelledby` at the heading. */
@Directive({ selector: '[dsComboboxGroup]', host: { role: 'group' } })
export class DsComboboxGroup {}

/** Shown when no item matches (hidden otherwise). */
@Directive({
  selector: '[dsComboboxEmpty]',
  host: { role: 'presentation', '[hidden]': '!root.empty()' },
})
export class DsComboboxEmpty {
  protected readonly root = inject(DsCombobox);
}

/** Every combobox part, for `imports: [DsComboboxParts]`. */
export const DsComboboxParts = [
  DsCombobox,
  DsComboboxAnchor,
  DsComboboxInput,
  DsComboboxTrigger,
  DsComboboxContent,
  DsComboboxList,
  DsComboboxItem,
  DsComboboxGroup,
  DsComboboxEmpty,
] as const;
