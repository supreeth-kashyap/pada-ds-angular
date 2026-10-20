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
  dataFlag,
  DsSliderParts,
  injectControlStatus,
  injectFieldContext,
  uniqueId,
} from 'pada-ds-angular/headless';

/**
 * A labelled single-value slider with an optional live value, description and error. Arrow
 * keys step, PageUp/PageDown take ten steps, Home/End jump to the limits, and pressing or
 * dragging anywhere on the track moves the thumb. Works with Angular forms (a number) or
 * through `[(value)]`.
 *
 * ```html
 * <ds-slider label="Volume" [min]="0" [max]="100" showValue formControlName="volume" />
 * ```
 *
 * Without a visible `label`, pass `aria-label`. Inside a `ds-field`, the thumb takes the
 * field's id, description and error (give it a `label` or `aria-label` too: a `<label for>`
 * cannot name a `role="slider"` element). Differences from React: it is built on the headless
 * Slider parts (a `role="slider"` thumb) instead of a native range input, so the keyboard map
 * and the look are the same in every browser; it adds `valueCommit` and `name`.
 */
@Component({
  selector: 'ds-slider',
  imports: [DsSliderParts],
  templateUrl: './slider.html',
  styleUrl: './slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.aria-label]': 'null' },
})
export class SliderComponent implements ControlValueAccessor, OnInit {
  /** Visible label. */
  readonly label = input<string>();
  /** Accessible name when there is no visible label. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  /** Help text under the slider, hidden while the error shows. */
  readonly description = input<string>();
  /** Validation message; marks the slider invalid (with forms, once touched). */
  readonly error = input<string>();
  /** The value. Two-way bindable: `[(value)]`. @default 0 */
  readonly value = model(0);
  /** @default 0 */
  readonly min = input(0, { transform: numberAttribute });
  /** @default 100 */
  readonly max = input(100, { transform: numberAttribute });
  /** @default 1 */
  readonly step = input(1, { transform: numberAttribute });
  /** PageUp/PageDown step. @default step × 10 */
  readonly largeStep = input<number>();
  /** Show the current value next to the label. */
  readonly showValue = input(false, { transform: booleanAttribute });
  /** Disables the slider. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Shows the required asterisk after the label. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Submits the value with a native form under this name. */
  readonly name = input<string>();
  /** Id of the thumb. Generated when omitted; inside a `ds-field`, the field's id wins. */
  readonly thumbId = input(uniqueId('ds-slider-'));
  /** A drag ended or a key press changed the value. */
  readonly valueCommit = output<number>();

  protected readonly id = uniqueId('ds-slider-');
  private readonly status = injectControlStatus(this);
  protected readonly field = injectFieldContext(() => this.thumbId());
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(
    () => this.disabled() || this.formsDisabled() || this.field.disabled(),
  );
  protected readonly isRequired = computed(
    () => this.required() || this.status.required() || this.field.required(),
  );
  protected readonly invalid = computed(
    () => (this.status.ngControl ? this.status.invalid() : !!this.error()) || this.field.invalid(),
  );
  protected readonly showError = computed(() => !!this.error() && this.invalid());
  protected readonly values = computed(() => [this.value()]);
  protected readonly describedBy = computed(
    () =>
      [
        this.showError()
          ? `${this.id}-error`
          : this.description()
            ? `${this.id}-description`
            : null,
        this.field.describedBy(),
      ]
        .filter(Boolean)
        .join(' ') || null,
  );
  protected readonly flag = dataFlag;

  private onChange: (value: number) => void = () => {};
  protected onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
    this.field.register(this.status);
  }

  protected handleChange(values: number[]) {
    this.value.set(values[0]);
    this.onChange(values[0]);
  }

  writeValue(value: number | null): void {
    this.value.set(typeof value === 'number' ? value : this.min());
  }
  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}
