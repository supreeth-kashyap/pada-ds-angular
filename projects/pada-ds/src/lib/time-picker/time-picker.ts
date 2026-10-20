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
  viewChild,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import {
  DsTimeField,
  DsTimeSegment,
  DsVisuallyHidden,
  injectControlStatus,
  uniqueId,
  type HourCycle,
  type TimeGranularity,
} from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

/**
 * A labelled time-of-day field in segments: hours, minutes (and seconds), and AM/PM on a
 * 12-hour clock, in the locale's order. Each segment is a spinbutton: ArrowUp/ArrowDown step it,
 * PageUp/PageDown by a larger step, Home/End to its ends, digits type into it, A/P set AM/PM,
 * Backspace empties it, ArrowLeft/ArrowRight (or Tab) move between segments. The value is a
 * 24-hour `"HH:mm"` (or `"HH:mm:ss"`) string, null until every segment is filled. Works with
 * Angular forms (`formControlName`, `[(ngModel)]`) or on its own (`[(value)]`).
 *
 * ```html
 * <ds-time-picker label="Start time" [(value)]="start" [minuteStep]="15" />
 * <ds-time-picker label="Alarm" granularity="second" [hourCycle]="24" formControlName="alarm" />
 * ```
 *
 * With a forms control, `error` shows only once the control is invalid and touched; without one,
 * setting `error` marks the field invalid. A value outside `min`/`max` is marked invalid too.
 *
 * React has no TimePicker yet; this follows the `docs/roadmap/04-components.md` entry ("time
 * segments, spinbutton"), styled like `ds-input-text`. There is no dropdown of times: the
 * segments are the whole control.
 */
@Component({
  selector: 'ds-time-picker',
  imports: [DsTimeField, DsTimeSegment, DsVisuallyHidden, IconComponent],
  templateUrl: './time-picker.html',
  styleUrl: './time-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimePickerComponent implements ControlValueAccessor, OnInit {
  /** Visible label naming the group of segments. */
  readonly label = input<string>();
  /** Help text under the field, hidden while the error shows. */
  readonly description = input<string>();
  /** Validation message. */
  readonly error = input<string>();
  /** The time, `"HH:mm"` or `"HH:mm:ss"` (24-hour), or null. Two-way bindable: `[(value)]`. */
  readonly value = model<string | null>(null);
  /** Smallest unit entered. @default 'minute' */
  readonly granularity = input<TimeGranularity>('minute');
  /** 12- or 24-hour clock. Follows the locale when unset. */
  readonly hourCycle = input<HourCycle | undefined>(undefined);
  /** Locale for the segment order, clock and AM/PM names. Defaults to the browser's. */
  readonly locale = input<string | undefined>(undefined);
  /** Minutes the arrow keys step by. @default 1 */
  readonly minuteStep = input(1, { transform: numberAttribute });
  /** Earliest valid time (`"HH:mm"`). */
  readonly min = input<string | undefined>(undefined);
  /** Latest valid time (`"HH:mm"`). */
  readonly max = input<string | undefined>(undefined);
  readonly required = input(false, { transform: booleanAttribute });
  /** Show "(optional)" after the label. */
  readonly optional = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Submits the value with a native form under this name. */
  readonly name = input<string>();
  /** Id of the group. Generated when omitted. */
  readonly inputId = input(uniqueId('ds-time-picker-'));

  private readonly field = viewChild(DsTimeField);
  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly isRequired = computed(() => this.required() || this.status.required());
  private readonly outOfRange = computed(() => this.field()?.outOfRange() ?? false);
  protected readonly invalid = computed(
    () => (this.status.ngControl ? this.status.invalid() : !!this.error()) || this.outOfRange(),
  );
  protected readonly showError = computed(() => !!this.error() && this.invalid());

  protected readonly labelId = computed(() => `${this.inputId()}-label`);
  protected readonly descriptionId = computed(() => `${this.inputId()}-description`);
  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  protected readonly describedBy = computed(() =>
    this.showError() ? this.errorId() : this.description() ? this.descriptionId() : null,
  );

  private onChange: (value: string | null) => void = () => {};
  protected onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
  }

  protected handleChange(value: string | null) {
    this.value.set(value);
    this.onChange(value);
  }

  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? null);
    // Clears a half-entered time too, which a null value alone would keep. Before the view
    // exists, the value binding is enough.
    this.field()?.reset(value ?? null);
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
