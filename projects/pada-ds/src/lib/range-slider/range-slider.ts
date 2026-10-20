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
import { dataFlag, DsSliderParts, injectControlStatus, uniqueId } from 'pada-ds-angular/headless';

/** `[low, high]`. */
export type RangeSliderValue = [number, number];

/**
 * A slider with two thumbs for picking a range (price, dates, size). Each thumb is a slider in
 * its own right: arrow keys step, PageUp/PageDown take ten steps, Home/End jump as far as the
 * other thumb allows. Pressing the track moves the nearest thumb. Works with Angular forms
 * (`[low, high]`) or through `[(value)]`.
 *
 * ```html
 * <ds-range-slider label="Price" [min]="0" [max]="500" [(value)]="price"
 *   locale="en-US" [formatOptions]="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }" />
 * ```
 *
 * Difference from React: `value` is `null` until set, which shows `[min, max]`.
 */
@Component({
  selector: 'ds-range-slider',
  imports: [DsSliderParts],
  templateUrl: './range-slider.html',
  styleUrl: './range-slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeSliderComponent implements ControlValueAccessor, OnInit {
  /** Visible label naming the group; the thumbs are named after it. */
  readonly label = input.required<string>();
  /** `[low, high]`; `null` shows `[min, max]`. Two-way bindable: `[(value)]`. */
  readonly value = model<RangeSliderValue | null>(null);
  /** @default 0 */
  readonly min = input(0, { transform: numberAttribute });
  /** @default 100 */
  readonly max = input(100, { transform: numberAttribute });
  /** @default 1 */
  readonly step = input(1, { transform: numberAttribute });
  /** Steps kept between the two thumbs. @default 0 */
  readonly minStepsBetweenThumbs = input(0, { transform: numberAttribute });
  /** Number format for the values shown and announced. */
  readonly formatOptions = input<Intl.NumberFormatOptions>();
  /** Locale for the format. Defaults to the browser's. */
  readonly locale = input<string>();
  /** Show the selected range next to the label. @default true */
  readonly showValue = input(true, { transform: booleanAttribute });
  /** Accessible names of the thumbs. @default ['Minimum <label>', 'Maximum <label>'] */
  readonly thumbLabels = input<[string, string]>();
  /** Help text under the slider, hidden while the error shows. */
  readonly description = input<string>();
  /** Validation message; marks the slider invalid (with forms, once touched). */
  readonly error = input<string>();
  /** Disables both thumbs. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Submits both values with a native form under this name. */
  readonly name = input<string>();
  /** A drag ended or a key press changed the value. */
  readonly valueCommit = output<RangeSliderValue>();

  protected readonly id = uniqueId('ds-range-slider-');
  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly invalid = computed(() =>
    this.status.ngControl ? this.status.invalid() : !!this.error(),
  );
  protected readonly showError = computed(() => !!this.error() && this.invalid());
  protected readonly current = computed<RangeSliderValue>(
    () => this.value() ?? [this.min(), this.max()],
  );
  private readonly format = computed(
    () => new Intl.NumberFormat(this.locale(), this.formatOptions()),
  );
  protected readonly texts = computed(() => this.current().map((v) => this.format().format(v)));
  protected readonly labels = computed(
    () =>
      this.thumbLabels() ?? [
        `Minimum ${this.label().toLowerCase()}`,
        `Maximum ${this.label().toLowerCase()}`,
      ],
  );
  protected readonly describedBy = computed(() =>
    this.showError() ? `${this.id}-error` : this.description() ? `${this.id}-description` : null,
  );
  protected readonly flag = dataFlag;

  private onChange: (value: RangeSliderValue) => void = () => {};
  protected onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
  }

  protected handleChange(values: number[]) {
    const next: RangeSliderValue = [values[0], values[1]];
    this.value.set(next);
    this.onChange(next);
  }

  protected handleCommit(values: number[]) {
    this.valueCommit.emit([values[0], values[1]]);
  }

  writeValue(value: RangeSliderValue | null): void {
    this.value.set(Array.isArray(value) && value.length === 2 ? [value[0], value[1]] : null);
  }
  registerOnChange(fn: (value: RangeSliderValue) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}
