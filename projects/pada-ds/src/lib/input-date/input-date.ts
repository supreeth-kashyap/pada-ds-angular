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
import {
  DsPopover,
  DsPopoverContent,
  DsPopoverTrigger,
  DsPresence,
  DsVisuallyHidden,
  injectControlStatus,
  uniqueId,
} from 'pada-ds-angular/headless';
import {
  DatePickerComponent,
  type DatePickerMode,
  type DatePickerSelection,
  type DatePickerValue,
} from '../date-picker/date-picker';
import { IconComponent } from '../icon/icon';

const formatDate = (date: Date | null | undefined, mode: DatePickerMode, locale?: string) => {
  if (!date) return '';
  if (mode === 'year') return String(date.getFullYear());
  if (mode === 'month')
    return new Intl.DateTimeFormat(locale ?? 'en-US', { month: 'long', year: 'numeric' }).format(
      date,
    );
  return date.toLocaleDateString(locale ?? 'en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

/**
 * A date field: a button showing the chosen date (or range) that opens the date picker in a
 * popover dialog. Focus moves to the selected day; picking closes the dialog (a range once both
 * ends are picked); Escape closes it without choosing; focus returns to the field. Works with
 * Angular forms (`formControlName`, `[(ngModel)]`) or on its own (`[(value)]`).
 *
 * ```html
 * <ds-input-date label="Due date" [(value)]="due" [minDate]="today" />
 * <ds-input-date label="Trip" selection="range" formControlName="trip" description="Up to 14 nights." />
 * ```
 *
 * With a forms control, `error` shows only once the control is invalid and touched; without one,
 * setting `error` marks the field invalid.
 *
 * Differences from React: the field's accessible name includes the shown value (React names it
 * by the label only); `required` is announced through the label instead of `aria-required`,
 * which a button does not support; `locale` and `today` are inputs. Like React, the value is
 * picked in the calendar, not typed.
 */
@Component({
  selector: 'ds-input-date',
  imports: [
    DsPopover,
    DsPopoverTrigger,
    DsPopoverContent,
    DsPresence,
    DsVisuallyHidden,
    DatePickerComponent,
    IconComponent,
  ],
  templateUrl: './input-date.html',
  styleUrl: './input-date.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDateComponent implements ControlValueAccessor, OnInit {
  /** Visible label; the dialog is named "Choose {label}". */
  readonly label = input<string>();
  /** Help text under the field, hidden while the error shows. */
  readonly description = input<string>();
  /** Validation message. */
  readonly error = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  /** Show "(optional)" after the label. */
  readonly optional = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Text shown while there is no value. @default 'Select date' */
  readonly placeholder = input('Select date');
  /** Force the filled (or empty) look. Follows the value when unset. */
  readonly filled = input<boolean | undefined>(undefined);
  /** What is picked: days, months or years. @default 'date' */
  readonly mode = input<DatePickerMode>('date');
  /** One value, or a range. @default 'single' */
  readonly selection = input<DatePickerSelection>('single');
  /** The value: a `Date`, or `[start, end?]` in range selection. Two-way bindable: `[(value)]`. */
  readonly value = model<DatePickerValue>(null);
  /** Earliest selectable day. */
  readonly minDate = input<Date | null | undefined>(undefined);
  /** Latest selectable day. */
  readonly maxDate = input<Date | null | undefined>(undefined);
  /** Marks other days unavailable (weekends, holidays, booked dates). */
  readonly isDateUnavailable = input<((date: Date) => boolean) | undefined>(undefined);
  /** First day of the week: 0 = Sunday … 6 = Saturday. @default 0 */
  readonly weekStartsOn = input(0, { transform: numberAttribute });
  /** Locale for the shown value and the calendar. Defaults to `en-US` formatting, as in React. */
  readonly locale = input<string | undefined>(undefined);
  /** The day marked as today. Defaults to the current date. */
  readonly today = input<Date | undefined>(undefined);
  /** Id of the field's button. Generated when omitted. */
  readonly inputId = input(uniqueId('ds-input-date-'));

  protected readonly open = signal(false);
  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly invalid = computed(() =>
    this.status.ngControl ? this.status.invalid() : !!this.error(),
  );
  protected readonly isRequired = computed(() => this.required() || this.status.required());

  protected readonly labelId = computed(() => `${this.inputId()}-label`);
  protected readonly valueId = computed(() => `${this.inputId()}-value`);
  protected readonly descriptionId = computed(() => `${this.inputId()}-description`);
  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  protected readonly showError = computed(() => !!this.error() && this.invalid());
  protected readonly describedBy = computed(() =>
    this.showError() ? this.errorId() : this.description() ? this.descriptionId() : null,
  );
  protected readonly labelledBy = computed(() =>
    this.label() ? `${this.labelId()} ${this.valueId()}` : null,
  );
  protected readonly dialogLabel = computed(() =>
    this.label() ? `Choose ${this.label()}` : 'Choose date',
  );

  protected readonly display = computed(() => {
    const value = this.value();
    const mode = this.mode();
    const locale = this.locale();
    if (this.selection() === 'range') {
      if (!Array.isArray(value) || !value[0]) return '';
      const start = formatDate(value[0], mode, locale);
      return value[1] ? `${start} -> ${formatDate(value[1], mode, locale)}` : `${start} -> ...`;
    }
    return value instanceof Date ? formatDate(value, mode, locale) : '';
  });
  protected readonly isFilled = computed(() => this.filled() ?? this.display() !== '');

  private onChange: (value: DatePickerValue) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
  }

  protected setOpen(open: boolean) {
    const next = open && !this.isDisabled();
    if (this.open() && !next) this.onTouched();
    this.open.set(next);
  }

  protected pick(value: DatePickerValue) {
    this.value.set(value);
    this.onChange(value);
    // Close once the choice is complete: one date, or both ends of a range.
    if (this.selection() === 'single' || (Array.isArray(value) && value[1])) this.setOpen(false);
  }

  writeValue(value: DatePickerValue | undefined): void {
    this.value.set(value ?? null);
  }
  registerOnChange(fn: (value: DatePickerValue) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}
