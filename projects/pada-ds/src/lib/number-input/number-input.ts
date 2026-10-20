import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  numberAttribute,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import {
  DsField,
  DsFieldControl,
  DsFieldDescription,
  DsFieldError,
  DsFieldLabel,
  DsNumberInputParts,
  injectControlStatus,
  uniqueId,
} from 'pada-ds-angular/headless';

export type NumberInputStepper = 'stacked' | 'split' | 'none';
export type NumberInputSize = 'sm' | 'md' | 'lg';

/**
 * A number field (WAI-ARIA APG Spinbutton): type a value, or use Up/Down, PageUp/PageDown and
 * Home/End, or the steppers (hold to repeat). Values are formatted with `formatOptions`
 * (currency, percent, units) and typed text is parsed in the same locale; typed text commits
 * on Enter or blur, clamped to `min`/`max`. Works with Angular forms (`number | null`) or
 * through `[(value)]`.
 *
 * ```html
 * <ds-number-input label="Seats" [min]="1" [max]="50" formControlName="seats" />
 * <ds-number-input label="Budget" locale="en-US" [step]="100" [(value)]="budget"
 *   [formatOptions]="{ style: 'currency', currency: 'USD' }" stepper="split" />
 * ```
 *
 * With a forms control, `error` shows only once the control is invalid and touched; without
 * one, setting `error` marks the field invalid (as InputText does).
 */
@Component({
  selector: 'ds-number-input',
  imports: [
    DsField,
    DsFieldLabel,
    DsFieldControl,
    DsFieldDescription,
    DsFieldError,
    DsNumberInputParts,
  ],
  templateUrl: './number-input.html',
  styleUrl: './number-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberInputComponent implements ControlValueAccessor, OnInit {
  /** Visible label. */
  readonly label = input.required<string>();
  /** Help text under the field, hidden while the error shows. */
  readonly description = input<string>();
  /** Validation message. */
  readonly error = input<string>();
  /** The value, `null` when empty. Two-way bindable: `[(value)]`. */
  readonly value = model<number | null>(null);
  /** @default -Infinity */
  readonly min = input(-Infinity, { transform: numberAttribute });
  /** @default Infinity */
  readonly max = input(Infinity, { transform: numberAttribute });
  /** Arrow keys and the steppers change the value by this much. @default 1 */
  readonly step = input(1, { transform: numberAttribute });
  /** PageUp and PageDown change the value by this much. @default step × 10 */
  readonly largeStep = input<number>();
  /** Display format: currency, percent, units, fraction digits. */
  readonly formatOptions = input<Intl.NumberFormatOptions>();
  /** Locale for formatting and parsing. Defaults to the browser's. */
  readonly locale = input<string>();
  /** `stacked`: up/down arrows at the end; `split`: minus at the start and plus at the end. @default 'stacked' */
  readonly stepper = input<NumberInputStepper>('stacked');
  /** Control height. @default 'md' */
  readonly size = input<NumberInputSize>('md');
  readonly placeholder = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  /** Show "(optional)" after the label. */
  readonly optional = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Submits the raw number with a native form under this name. */
  readonly name = input<string>();
  /** Id of the input. Generated when omitted. */
  readonly inputId = input(uniqueId('ds-number-input-'));
  /** The input lost focus. */
  readonly blurred = output<FocusEvent>();

  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly invalid = computed(() =>
    this.status.ngControl ? this.status.invalid() : !!this.error(),
  );
  protected readonly isRequired = computed(() => this.required() || this.status.required());

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
  }

  protected handleChange(value: number | null) {
    this.value.set(value);
    this.onChange(value);
  }

  protected handleBlur(event: FocusEvent) {
    this.onTouched();
    this.blurred.emit(event);
  }

  writeValue(value: number | null): void {
    this.value.set(typeof value === 'number' && !Number.isNaN(value) ? value : null);
  }
  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}
