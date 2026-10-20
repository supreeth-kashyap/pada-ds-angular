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
  type DateRangeValue,
} from 'pada-ds-angular/headless';
import {
  CalendarGridComponent,
  CalendarHeadingComponent,
  CalendarNextButtonComponent,
  CalendarPrevButtonComponent,
  CalendarRootComponent,
} from '../calendar/calendar';
import { IconComponent } from '../icon/icon';

/** A complete range: both ends set. */
export type DateRange = [Date, Date];

/** A shortcut in the picker's side list ("Last 7 days"). */
export interface DateRangePreset {
  /** The button's text. */
  label: string;
  /** The range it picks. */
  range: DateRange;
}

const sameDay = (a: Date | undefined, b: Date | undefined) =>
  !!a &&
  !!b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * A date range field: a button showing the chosen range that opens a two-month range calendar
 * (and optional presets) in a popover dialog. The first click picks the start, the second the end;
 * the hovered or focused day previews the range in between. Picking the end (or a preset) closes
 * the dialog and returns focus to the field; Escape closes it and keeps the previous range. Works
 * with Angular forms (`formControlName`, `[(ngModel)]`) or on its own (`[(value)]`).
 *
 * ```html
 * <ds-date-range-picker label="Stay" [(value)]="stay" [minDate]="today" />
 * <ds-date-range-picker label="Report period" formControlName="period" [presets]="presets" [weekStartsOn]="1" />
 * ```
 *
 * The calendar keyboard is the `ds-calendar` grid's: arrow keys by day and week (crossing from
 * one month's grid into the other), Home/End to the week's ends, PageUp/PageDown by month (Shift:
 * by year), Enter or Space picks.
 *
 * React has no two-month DateRangePicker yet (its `InputDate` with `selection="range"` shows one
 * month); this follows the `docs/roadmap/04-components.md` entry ("two-month range selection
 * with presets") in the style of `ds-input-date`. Unlike `ds-input-date` in range selection, the
 * value only changes once both ends are picked: a half-picked range is a draft inside the
 * dialog, dropped if it closes, so a forms control never holds `[start]` alone.
 */
@Component({
  selector: 'ds-date-range-picker',
  imports: [
    DsPopover,
    DsPopoverTrigger,
    DsPopoverContent,
    DsPresence,
    DsVisuallyHidden,
    CalendarRootComponent,
    CalendarHeadingComponent,
    CalendarPrevButtonComponent,
    CalendarNextButtonComponent,
    CalendarGridComponent,
    IconComponent,
  ],
  templateUrl: './date-range-picker.html',
  styleUrl: './date-range-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangePickerComponent implements ControlValueAccessor, OnInit {
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
  /** Text shown while there is no value. @default 'Select dates' */
  readonly placeholder = input('Select dates');
  /** The range: `[start, end]`, or null. Two-way bindable: `[(value)]`. */
  readonly value = model<DateRange | null>(null);
  /** Earliest selectable day. */
  readonly minDate = input<Date | null | undefined>(undefined);
  /** Latest selectable day. */
  readonly maxDate = input<Date | null | undefined>(undefined);
  /** Marks other days unavailable (weekends, holidays, booked dates). */
  readonly isDateUnavailable = input<((date: Date) => boolean) | undefined>(undefined);
  /** First day of the week: 0 = Sunday … 6 = Saturday. @default 0 */
  readonly weekStartsOn = input(0, { transform: numberAttribute });
  /** Locale for the shown range and the calendar. Defaults to the browser's. */
  readonly locale = input<string | undefined>(undefined);
  /** The day marked as today. Defaults to the current date. */
  readonly today = input<Date | undefined>(undefined);
  /** Months shown side by side. @default 2 */
  readonly numberOfMonths = input(2, { transform: numberAttribute });
  /** Shortcuts listed beside the calendar. */
  readonly presets = input<readonly DateRangePreset[]>([]);
  /** Id of the field's button. Generated when omitted. */
  readonly inputId = input(uniqueId('ds-date-range-picker-'));

  protected readonly open = signal(false);
  /** The range in the calendar while the dialog is open, `[start]` while the end is picked. */
  protected readonly draft = signal<DateRangeValue | null>(null);

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
    this.label() ? `Choose ${this.label()}` : 'Choose dates',
  );
  protected readonly offsets = computed(() =>
    Array.from({ length: Math.max(1, Math.floor(this.numberOfMonths())) }, (_, index) => index),
  );

  /** The range, formatted for the locale ("Mar 3 – 6, 2026"). */
  protected readonly display = computed(() => {
    const value = this.value();
    if (!value?.[0] || !value[1]) return '';
    const format = new Intl.DateTimeFormat(this.locale(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return format.formatRange(value[0], value[1]);
  });

  protected readonly presetStates = computed(() => {
    const value = this.value();
    return this.presets().map((preset) => ({
      preset,
      selected: sameDay(value?.[0], preset.range[0]) && sameDay(value?.[1], preset.range[1]),
    }));
  });

  private onChange: (value: DateRange | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
  }

  protected setOpen(open: boolean) {
    const next = open && !this.isDisabled();
    if (next && !this.open()) this.draft.set(this.value());
    if (this.open() && !next) this.onTouched();
    this.open.set(next);
  }

  protected pickRange(range: DateRangeValue | null) {
    this.draft.set(range);
    if (range?.[0] && range[1]) this.commit([range[0], range[1]]);
  }

  protected pickPreset(preset: DateRangePreset) {
    this.commit(preset.range);
  }

  private commit(range: DateRange) {
    this.value.set(range);
    this.onChange(range);
    this.setOpen(false);
  }

  writeValue(value: DateRange | null | undefined): void {
    this.value.set(value?.[0] && value[1] ? value : null);
  }
  registerOnChange(fn: (value: DateRange | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}
