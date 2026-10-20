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
import { NgTemplateOutlet } from '@angular/common';
import { ControlValueAccessor } from '@angular/forms';
import { dataFlag, injectControlStatus, uniqueId } from 'pada-ds-angular/headless';

export type RatingSize = 'sm' | 'md' | 'lg';

/**
 * A star rating. Interactive ratings are a radio group (Tab in, arrow keys to change, and the
 * value submits with native forms); hovering previews, and clicking the current rating again
 * clears it. Read-only ratings are a single image named "4.5 out of 5 stars", with fractions
 * drawn partly filled. Works with Angular forms (a number, 0 for none) or through `[(value)]`.
 *
 * ```html
 * <ds-rating label="Your rating" formControlName="stars" />
 * <ds-rating label="Average" [value]="4.5" readonly />
 * ```
 */
@Component({
  selector: 'ds-rating',
  imports: [NgTemplateOutlet],
  templateUrl: './rating.html',
  styleUrl: './rating.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingComponent implements ControlValueAccessor, OnInit {
  /** Names the rating; shown beside the stars unless `showLabel` is off. */
  readonly label = input.required<string>();
  /** The rating, 0 for none. Two-way bindable: `[(value)]`. */
  readonly value = model(0);
  /** Number of stars. @default 5 */
  readonly max = input(5, { transform: numberAttribute });
  /** Show the rating without letting people change it. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Disables the stars. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Clicking the current rating again clears it. @default true */
  readonly allowClear = input(true, { transform: booleanAttribute });
  /** Show the label beside the stars (it names the control either way). @default true */
  readonly showLabel = input(true, { transform: booleanAttribute });
  /** Star size. @default 'md' */
  readonly size = input<RatingSize>('md');
  /** Name for native form submission. Generated when omitted. */
  readonly name = input(uniqueId('ds-rating-'));

  protected readonly id = uniqueId('ds-rating-');
  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly hover = signal<number | null>(null);
  protected readonly shown = computed(() => this.hover() ?? this.value());
  protected readonly stars = computed(() =>
    Array.from({ length: this.max() }, (_, index) => index + 1),
  );
  /** Fill of each star as a percentage: fractions for read-only, whole stars otherwise. */
  protected readonly fills = computed(() =>
    this.stars().map((star) =>
      this.readonly()
        ? `${Math.max(0, Math.min(1, this.value() - star + 1)) * 100}%`
        : star <= this.shown()
          ? '100%'
          : '0%',
    ),
  );
  protected readonly summary = computed(
    () =>
      `${this.showLabel() ? '' : `${this.label()}: `}${this.value()} out of ${this.max()} stars`,
  );
  protected readonly flag = dataFlag;

  private onChange: (value: number) => void = () => {};
  protected onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
  }

  protected preview(star: number) {
    if (!this.isDisabled()) this.hover.set(star);
  }

  private set(value: number) {
    this.value.set(value);
    this.onChange(value);
  }

  protected handleClick(star: number) {
    // Runs before `change`, so `value` is still the previous rating.
    if (this.allowClear() && this.value() === star) this.set(0);
  }

  protected handleChange(star: number) {
    this.set(star);
  }

  writeValue(value: number | null): void {
    this.value.set(typeof value === 'number' ? value : 0);
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
