import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  model,
  numberAttribute,
  OnInit,
  signal,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import {
  DsCalendarHeading,
  injectControlStatus,
  type DateRangeValue,
} from 'pada-ds-angular/headless';
import {
  CalendarGridComponent,
  CalendarNextButtonComponent,
  CalendarPrevButtonComponent,
  CalendarRootComponent,
} from '../calendar/calendar';
import { IconComponent } from '../icon/icon';

/** Which unit the picker chooses: a day, a month or a year. */
export type DatePickerMode = 'date' | 'month' | 'year';
/** One value, or a start and an end. */
export type DatePickerSelection = 'single' | 'range';
/** A date in single selection, a range (`[start]` or `[start, end]`) in range selection. */
export type DatePickerValue = Date | DateRangeValue | null;

type PickerView = 'calendar' | 'month' | 'year';
type BoxState = 'rest' | 'hover' | 'active';

interface PickerBox {
  key: number;
  label: string;
  selected: boolean;
  today: boolean;
  state: BoxState;
}

const sameMonth = (date: Date | null, year: number, month: number) =>
  !!date && date.getFullYear() === year && date.getMonth() === month;

const yearsAround = (date: Date) => {
  const start = Math.floor(date.getFullYear() / 12) * 12;
  return Array.from({ length: 12 }, (_, index) => start + index);
};

/**
 * The date picker panel. Days are a keyboard-navigable `ds-calendar` grid (arrow keys,
 * Home/End, PageUp/PageDown); the month heading opens a month view, and the year a year view.
 * With `mode="month"` or `mode="year"` it picks months or years instead. Works with Angular forms
 * (`formControlName`, `[(ngModel)]`) or on its own (`[(value)]`).
 *
 * ```html
 * <ds-date-picker [(value)]="due" [minDate]="today" />
 * <ds-date-picker selection="range" [(value)]="trip" locale="en-GB" [weekStartsOn]="1" />
 * <ds-date-picker mode="month" formControlName="billingMonth" />
 * ```
 *
 * Differences from React (`DatePickerDropdown`): the selector is `ds-date-picker`; `isRange` is
 * dropped in favour of `selection="range"`; month names come from `Intl` in `locale` (React
 * uses fixed English names); `disabled` and `today` are inputs.
 */
@Component({
  selector: 'ds-date-picker',
  imports: [
    CalendarRootComponent,
    CalendarPrevButtonComponent,
    CalendarNextButtonComponent,
    CalendarGridComponent,
    DsCalendarHeading,
    IconComponent,
  ],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePickerComponent implements ControlValueAccessor, OnInit {
  /** What is picked: days (`date`), months or years. @default 'date' */
  readonly mode = input<DatePickerMode>('date');
  /** One value, or a range picked with two clicks. @default 'single' */
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
  /** Locale for month and day names. Defaults to the browser's. */
  readonly locale = input<string | undefined>(undefined);
  /** Nothing can be picked. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The day, month and year marked as current. Defaults to the current date. */
  readonly today = input<Date | undefined>(undefined);

  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  private onChange: (value: DatePickerValue) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly todayDate = computed(() => this.today() ?? new Date());
  protected readonly isRange = computed(() => this.selection() === 'range');
  protected readonly singleValue = computed(() => {
    const value = this.value();
    return value instanceof Date ? value : null;
  });
  protected readonly rangeValue = computed(() => {
    const value = this.value();
    return Array.isArray(value) ? value : null;
  });
  private readonly rangeStart = computed(() => this.rangeValue()?.[0] ?? null);
  private readonly rangeEnd = computed(() => this.rangeValue()?.[1] ?? null);

  /** The month (day view) or year (month and year views) on screen. */
  protected readonly viewDate = linkedSignal<Date>(
    () => this.singleValue() ?? this.rangeStart() ?? this.todayDate(),
  );
  protected readonly view = linkedSignal<PickerView>(() =>
    this.mode() === 'date' ? 'calendar' : this.mode() === 'month' ? 'month' : 'year',
  );
  private readonly hoveredMonth = signal<number | null>(null);
  private readonly hoveredYear = signal<number | null>(null);

  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(
      this.viewDate(),
    ),
  );
  protected readonly year = computed(() => this.viewDate().getFullYear());
  protected readonly years = computed(() => yearsAround(this.viewDate()));
  protected readonly decadeLabel = computed(() => {
    const years = this.years();
    return `${years[0]} - ${years[years.length - 1]}`;
  });

  private readonly picking = computed(
    () => this.isRange() && !!this.rangeStart() && !this.rangeEnd(),
  );

  protected readonly months = computed<PickerBox[]>(() => {
    const year = this.year();
    const format = new Intl.DateTimeFormat(this.locale(), { month: 'short' });
    const today = this.todayDate();
    const start = this.rangeStart();
    const end = this.rangeEnd();
    const hovered = this.hoveredMonth();
    const key = (month: number, y = year) => y * 12 + month;
    return Array.from({ length: 12 }, (_, month) => {
      const selected = this.isRange()
        ? sameMonth(start, year, month) || sameMonth(end, year, month)
        : sameMonth(this.singleValue(), year, month);
      let inRange = false;
      if (this.isRange() && start) {
        const from = key(start.getMonth(), start.getFullYear());
        const to = end
          ? key(end.getMonth(), end.getFullYear())
          : this.picking() && hovered !== null
            ? key(hovered)
            : from;
        inRange = key(month) >= Math.min(from, to) && key(month) <= Math.max(from, to);
      }
      return {
        key: month,
        label: format.format(new Date(year, month, 1)),
        selected,
        today: sameMonth(today, year, month),
        state: selected ? 'active' : inRange ? 'hover' : 'rest',
      };
    });
  });

  protected readonly yearBoxes = computed<PickerBox[]>(() => {
    const start = this.rangeStart()?.getFullYear();
    const end = this.rangeEnd()?.getFullYear();
    const hovered = this.hoveredYear();
    const current = this.todayDate().getFullYear();
    const single = this.singleValue()?.getFullYear();
    return this.years().map((year) => {
      const selected = this.isRange() ? year === start || year === end : year === single;
      let inRange = false;
      if (this.isRange() && start !== undefined) {
        const to = end ?? (this.picking() && hovered !== null ? hovered : start);
        inRange = year >= Math.min(start, to) && year <= Math.max(start, to);
      }
      return {
        key: year,
        label: String(year),
        selected,
        today: year === current,
        state: selected ? 'active' : inRange ? 'hover' : 'rest',
      };
    });
  });

  ngOnInit() {
    this.status.connect();
  }

  protected setView(view: PickerView) {
    this.view.set(view);
  }

  protected shift(years: number) {
    const date = this.viewDate();
    this.viewDate.set(new Date(date.getFullYear() + years, date.getMonth(), 1));
  }

  protected showMonth(month: Date | undefined) {
    if (month) this.viewDate.set(month);
  }

  protected hoverMonth(month: number | null) {
    if (month === null || this.picking()) this.hoveredMonth.set(month);
  }

  protected hoverYear(year: number | null) {
    if (year === null || this.picking()) this.hoveredYear.set(year);
  }

  protected pickDay(value: Date | null) {
    this.commit(value);
  }

  protected pickRange(value: DateRangeValue | null) {
    this.commit(value);
  }

  protected pickMonth(month: number) {
    const date = new Date(this.year(), month, 1);
    if (this.mode() === 'month') this.pickUnit(date);
    else {
      this.viewDate.set(date);
      this.view.set('calendar');
    }
  }

  protected pickYear(year: number) {
    const date = new Date(year, this.viewDate().getMonth(), 1);
    if (this.mode() === 'year') this.pickUnit(date);
    else {
      this.viewDate.set(date);
      this.view.set(this.mode() === 'month' ? 'month' : 'calendar');
    }
  }

  private pickUnit(date: Date) {
    if (!this.isRange()) return this.commit(date);
    const start = this.rangeStart();
    if (!start || this.rangeEnd()) return this.commit([date]);
    this.commit(start < date ? [start, date] : [date, start]);
  }

  private commit(value: DatePickerValue) {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
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
