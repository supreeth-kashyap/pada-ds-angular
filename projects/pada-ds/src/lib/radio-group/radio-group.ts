import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  OnInit,
  signal,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { dataFlag, injectControlStatus, uniqueId } from 'pada-ds-angular/headless';

/** One choice in a `ds-radio-group`. */
export interface RadioGroupOption {
  label: string;
  value: string;
  disabled?: boolean;
}

/**
 * A single choice from a short list, on native radio inputs: Tab reaches the group (one tab
 * stop), arrow keys move and select (roving, as browsers do for radios), and the value submits
 * with native forms. Works with Angular forms (a string) or through `[(value)]`.
 *
 * ```html
 * <ds-radio-group label="Plan" [options]="plans" formControlName="plan" />
 * <ds-radio-group label="Size" [options]="sizes" [(value)]="size" />
 * ```
 *
 * The visible `label` names the `role="radiogroup"` element; without one, pass `aria-label`.
 * Differences from React: `value` is `null` when nothing is chosen, and `required` is
 * supported (the radios become required).
 */
@Component({
  selector: 'ds-radio-group',
  templateUrl: './radio-group.html',
  styleUrl: './radio-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-label]': 'null',
    '[attr.data-disabled]': 'flag(isDisabled())',
  },
})
export class RadioGroupComponent implements ControlValueAccessor, OnInit {
  /** The choices. */
  readonly options = input.required<readonly RadioGroupOption[]>();
  /** The chosen value, `null` when none. Two-way bindable: `[(value)]`. */
  readonly value = model<string | null>(null);
  /** Visible label naming the group. */
  readonly label = input<string>();
  /** Accessible name when there is no visible label. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  /** Name shared by the radios (and used for native form submission). Generated when omitted. */
  readonly name = input(uniqueId('ds-radio-group-'));
  /** Disables every option. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** A choice is required. */
  readonly required = input(false, { transform: booleanAttribute });

  protected readonly id = uniqueId('ds-radio-group-');
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
    if (this.isDisabled()) return;
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
