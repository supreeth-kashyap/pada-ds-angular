import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input } from '@angular/core';
import { injectButtonType } from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';
import type { ButtonSize } from './button';
import { BUTTON_GROUP, type ButtonGroupContext } from './button-context';

export type SplitButtonVariant = 'primary' | 'secondary';

/**
 * A main action joined to a chevron button that offers related ones. The two halves are separate
 * buttons with their own names and handlers; the splitter is usually a menu trigger. Put the
 * chevron part, `button[dsButtonSplitter]`, after a `button[dsButton]`.
 *
 * ```html
 * <ds-split-button variant="primary" label="Save options">
 *   <button dsButton (click)="save()">Save</button>
 *   <ds-dropdown-menu>
 *     <button dsButtonSplitter dsDropdownMenuTrigger></button>
 *     <ds-dropdown-menu-content>…</ds-dropdown-menu-content>
 *   </ds-dropdown-menu>
 * </ds-split-button>
 * ```
 *
 * Matches React's `SplitButton.Root` and `SplitButton.Splitter` (React's 1.x
 * `<Button split onSplitClick>` is deprecated and now renders them). Both halves are separate
 * buttons, so any directive (a menu trigger, a tooltip) can go on either one.
 */
@Component({
  selector: 'ds-split-button',
  template: '<ng-content />',
  styleUrl: './split-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: BUTTON_GROUP, useExisting: forwardRef(() => SplitButtonComponent) }],
  host: {
    role: 'group',
    '[attr.aria-label]': 'label() ?? null',
    '[attr.data-variant]': 'variant()',
  },
})
export class SplitButtonComponent implements ButtonGroupContext {
  /** Visual emphasis of both halves. @default 'primary' */
  readonly variant = input<SplitButtonVariant>('primary');
  /** Size of both halves. @default 'md' */
  readonly size = input<ButtonSize | undefined>(undefined);
  /** Accessible name of the pair, e.g. "Save options". */
  readonly label = input<string>();
}

/**
 * The chevron half of a split button: a square button with a down chevron, named by `label`.
 * Takes its variant and size from the surrounding `ds-split-button`.
 */
@Component({
  selector: 'button[dsButtonSplitter]',
  imports: [IconComponent],
  template: `<ds-icon class="button-icon" name="chevron_down" [size]="iconSize()" />`,
  styleUrls: ['./button.scss', './split-button-splitter.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'button button-splitter',
    '[attr.aria-label]': 'label()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-size]': 'resolvedSize()',
  },
})
export class ButtonSplitterComponent {
  /** Accessible name. @default 'More options' */
  readonly label = input('More options');
  /** Visual emphasis when used outside a `ds-split-button`. @default 'primary' */
  readonly variant = input<SplitButtonVariant | undefined>(undefined);
  /** Size when used outside a `ds-split-button`. @default 'md' */
  readonly size = input<ButtonSize | undefined>(undefined);

  private readonly group = inject(BUTTON_GROUP, { optional: true });
  protected readonly resolvedVariant = computed(
    () => this.variant() ?? this.group?.variant() ?? 'primary',
  );
  protected readonly resolvedSize = computed(() => this.size() ?? this.group?.size() ?? 'md');
  protected readonly iconSize = computed(() => (this.resolvedSize() === 'lg' ? 16 : 12));

  constructor() {
    injectButtonType();
  }
}

/** The split button parts, for `imports: [...SplitButtonParts]`. */
export const SplitButtonParts = [SplitButtonComponent, ButtonSplitterComponent] as const;
