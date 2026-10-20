import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { dataFlag, DsToolbarItem } from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

export type FilterChipVariant = 'filled' | 'prompt' | 'button';

/**
 * An applied filter shown as a chip ("Owner : Ada"). Its main button edits the filter (`edit`);
 * the cross removes it (`remove`). `prompt` is a dashed chip inviting a filter to be added, and
 * `button` a "Filters" chip. Inside a `ds-toolbar`, both buttons take part in its arrow-key
 * focus.
 *
 * ```html
 * <ds-filter-chip label="Owner" value="Ada" (edit)="openOwner()" (remove)="clearOwner()" />
 * ```
 *
 * Differences from React: `onClick` / `onRemove` are the `edit` / `remove` outputs.
 */
@Component({
  selector: 'ds-filter-chip',
  imports: [DsToolbarItem, IconComponent],
  template: `
    @if (variant() === 'filled' && showClose()) {
      <span class="filter-chip-remove">
        <button
          type="button"
          dsToolbarItem
          class="filter-chip-remove-button"
          [attr.aria-label]="'Remove filter ' + label() + ': ' + value()"
          [disabled]="disabled()"
          (click)="remove.emit()"
        >
          <ds-icon name="cross_1" [size]="12" />
        </button>
        <span class="filter-chip-divider" aria-hidden="true"></span>
      </span>
    }
    <button
      type="button"
      dsToolbarItem
      class="filter-chip-content"
      [disabled]="disabled()"
      (click)="edit.emit()"
    >
      @if (variant() === 'button') {
        <span class="filter-chip-button-label">Filters</span>
      } @else {
        <span class="filter-chip-label">{{ label() }}</span>
        <span class="filter-chip-colon">:</span>
        <span class="filter-chip-value">{{ value() }}</span>
      }
      <ds-icon name="chevron_down" class="filter-chip-chevron" [size]="12" />
    </button>
  `,
  styleUrl: './filter-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-disabled]': 'disabledFlag()',
  },
})
export class FilterChipComponent {
  /** `filled` (an applied filter), `prompt` (dashed) or `button` ("Filters"). @default 'filled' */
  readonly variant = input<FilterChipVariant>('filled');
  /** The filtered field, e.g. "Owner". */
  readonly label = input('Field');
  /** The filter's value, e.g. "Ada". */
  readonly value = input('Attribute');
  /** Shows the remove button (filled chips). @default true */
  readonly showClose = input(true, { transform: booleanAttribute });
  /** Disables both buttons. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The chip was pressed, to edit the filter. */
  readonly edit = output<void>();
  /** The remove button was pressed. */
  readonly remove = output<void>();

  protected readonly disabledFlag = computed(() => dataFlag(this.disabled()));
}
