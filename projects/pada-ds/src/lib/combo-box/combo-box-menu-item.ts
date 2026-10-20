import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { injectButtonType } from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

/**
 * One option of a `ds-combo-box`: a `<button role="option">` with an optional icon, the label
 * (projected) and, in multi-select lists, a tick. Disable it with the native `disabled`.
 *
 * ```html
 * <button dsComboBoxMenuItem iconName="team" [selected]="true">Team</button>
 * ```
 *
 * Difference from React: the label is projected content instead of a `label` prop, and the
 * multi-select tick shows only on selected options (React shows it on every option).
 */
@Component({
  selector: 'button[dsComboBoxMenuItem]',
  imports: [IconComponent],
  template: `
    @if (iconName(); as icon) {
      <span class="combo-box-menu-item__icon" aria-hidden="true">
        <ds-icon [name]="icon" [size]="16" />
      </span>
    }
    <span class="combo-box-menu-item__label"><ng-content /></span>
    @if (multiSelect()) {
      <span class="combo-box-menu-item__tick" aria-hidden="true">
        <ds-icon name="tick_1" [size]="12" />
      </span>
    }
  `,
  styleUrl: './combo-box-menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'combo-box-menu-item',
    role: 'option',
    '[attr.aria-selected]': 'selected()',
    '[attr.data-selected]': 'selected()',
    '[attr.data-multiselect]': 'multiSelect()',
  },
})
export class ComboBoxMenuItemComponent {
  /** Built-in icon name shown before the label. */
  readonly iconName = input<string>();
  /** Whether the option is selected (`aria-selected`). */
  readonly selected = input(false, { transform: booleanAttribute });
  /** Shows the tick of a multi-select list. */
  readonly multiSelect = input(false, { transform: booleanAttribute });

  constructor() {
    injectButtonType();
  }
}
