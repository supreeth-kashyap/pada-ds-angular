import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
} from '@angular/core';
import type { ButtonSize, ButtonVariant } from './button';
import { BUTTON_GROUP, type ButtonGroupContext } from './button-context';

export type ButtonGroupOrientation = 'horizontal' | 'vertical';

/**
 * A row (or column) of related buttons, `role="group"` and named by `label`. Buttons without
 * their own `size` / `variant` take the group's. `attached` joins them into one segmented
 * control: shared borders, outer corners only.
 *
 * ```html
 * <ds-button-group label="Text alignment" variant="secondary" size="sm" attached>
 *   <button dsButton leftIcon="align_left">Left</button>
 *   <button dsButton leftIcon="align_center">Center</button>
 *   <button dsButton leftIcon="align_right">Right</button>
 * </ds-button-group>
 * ```
 *
 * Every button keeps its own tab stop: a group of actions is not a toolbar. For one tab stop and
 * arrow keys, or pressed states, use `ds-toggle-group`. Matches React's `ButtonGroup`.
 */
@Component({
  selector: 'ds-button-group',
  template: '<ng-content />',
  styleUrl: './button-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: BUTTON_GROUP, useExisting: forwardRef(() => ButtonGroupComponent) }],
  host: {
    role: 'group',
    '[attr.aria-label]': 'label() ?? null',
    '[attr.aria-orientation]': 'orientation() === "vertical" ? "vertical" : null',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-attached]': 'attached() ? "" : null',
  },
})
export class ButtonGroupComponent implements ButtonGroupContext {
  /** Accessible name of the group, e.g. "Text alignment". */
  readonly label = input<string>();
  /** Size for the buttons that set none. */
  readonly size = input<ButtonSize | undefined>(undefined);
  /** Variant for the buttons that set none. */
  readonly variant = input<ButtonVariant | undefined>(undefined);
  /** Lays the buttons out in a row or a column. @default 'horizontal' */
  readonly orientation = input<ButtonGroupOrientation>('horizontal');
  /** Joins the buttons into one segmented control. */
  readonly attached = input(false, { transform: booleanAttribute });
}
