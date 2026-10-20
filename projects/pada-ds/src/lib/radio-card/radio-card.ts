import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  numberAttribute,
  OnInit,
  signal,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { dataFlag, injectControlStatus, uniqueId } from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

/** One card of a `ds-radio-card-group`. */
export interface RadioCardOption {
  value: string;
  title: string;
  description?: string;
  /** Built-in icon name shown at the top of the card. */
  icon?: string;
  /** Extra content at the end, e.g. a price. */
  meta?: string;
  disabled?: boolean;
}

/**
 * A single choice presented as cards with a title, description, icon and extra content (plans,
 * shipping speeds, templates). Built on native radio inputs in a `fieldset`: Tab reaches the
 * group, arrow keys move and select, and the value submits with native forms. Works with
 * Angular forms (a string) or through `[(value)]`.
 *
 * ```html
 * <ds-radio-card-group label="Plan" [options]="plans" formControlName="plan" [columns]="3" />
 * ```
 *
 * Difference from React: titles, descriptions and meta are strings (React takes nodes).
 */
@Component({
  selector: 'ds-radio-card-group',
  imports: [IconComponent],
  templateUrl: './radio-card.html',
  styleUrl: './radio-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioCardGroupComponent implements ControlValueAccessor, OnInit {
  /** The legend naming the group. */
  readonly label = input.required<string>();
  /** The cards. */
  readonly options = input.required<readonly RadioCardOption[]>();
  /** The chosen value, `null` when none. Two-way bindable: `[(value)]`. */
  readonly value = model<string | null>(null);
  /** Help text under the label. */
  readonly description = input<string>();
  /** Name for native form submission. Generated when omitted. */
  readonly name = input(uniqueId('ds-radio-card-'));
  /** Cards per row (they wrap to fewer on narrow screens). @default 3 */
  readonly columns = input(3, { transform: numberAttribute });
  /** Disables every card. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** A choice is required. */
  readonly required = input(false, { transform: booleanAttribute });

  protected readonly id = uniqueId('ds-radio-card-');
  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly isRequired = computed(() => this.required() || this.status.required());
  protected readonly flag = dataFlag;

  private onChange: (value: string | null) => void = () => {};
  protected onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
  }

  protected select(value: string) {
    this.value.set(value);
    this.onChange(value);
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }
  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}
