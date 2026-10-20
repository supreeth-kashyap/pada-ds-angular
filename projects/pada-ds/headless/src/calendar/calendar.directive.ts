import {
  afterNextRender,
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  signal,
} from '@angular/core';
import { injectButtonType } from '../utils/button';
import { dataFlag } from '../utils/dom';
import { uniqueId } from '../utils/id';
import {
  addDays,
  addMonths,
  clampDay,
  compareDays,
  getMonthGrid,
  isBetween,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  type DateRangeValue,
} from './dates';

/** `single` picks one day; `range` picks a start and an end day. */
export type CalendarMode = 'single' | 'range';

/** State of one day, for rendering a day and its data attributes. */
export interface CalendarDayState {
  date: Date;
  selected: boolean;
  today: boolean;
  outsideMonth: boolean;
  unavailable: boolean;
  focused: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  inRange: boolean;
}

/** A weekday column header: the short name to show and the long name for `abbr`. */
export interface CalendarWeekday {
  short: string;
  long: string;
}

/**
 * Holds a month calendar's selection, visible month, focused day and limits. WAI-ARIA APG: Date
 * Picker Dialog (the grid part). Works on any element, or on an `<ng-container>`.
 *
 * ```html
 * <div dsCalendar #cal="dsCalendar" mode="range" [(range)]="stay" [min]="today">
 *   <button dsCalendarPrevButton>‹</button>
 *   <h2 dsCalendarHeading>{{ cal.monthLabel() }}</h2>
 *   <button dsCalendarNextButton>›</button>
 *   <table dsCalendarGrid #grid="dsCalendarGrid">
 *     <thead><tr>
 *       @for (weekday of cal.weekdays(); track weekday.long) {
 *         <th scope="col" [attr.abbr]="weekday.long">{{ weekday.short }}</th>
 *       }
 *     </tr></thead>
 *     <tbody>
 *       @for (week of cal.weeks(); track week[0].getTime()) {
 *         <tr>
 *           @for (date of week; track date.getTime()) {
 *             <td [dsCalendarCell]="date"><button [dsCalendarDay]="date">{{ date.getDate() }}</button></td>
 *           }
 *         </tr>
 *       }
 *     </tbody>
 *   </table>
 * </div>
 * ```
 *
 * Unlike React, the single value and the range are two models (`value` and `range`), so each is
 * typed for two-way binding; there are no `default*` inputs (a one-way binding is the default).
 * `today` can be set, for tests and for apps that run on a server clock.
 */
@Directive({
  selector: '[dsCalendar]',
  exportAs: 'dsCalendar',
  host: {
    '[attr.data-disabled]': 'flag(disabled())',
    '[attr.data-readonly]': 'flag(readOnly())',
    '[attr.data-mode]': 'mode()',
  },
})
export class DsCalendar {
  /** `single` (default) picks one day, `range` a start and an end (two clicks). */
  readonly mode = input<CalendarMode>('single');
  /** The selected day in `single` mode. Two-way bindable: `[(value)]`. */
  readonly value = model<Date | null>(null);
  /**
   * The selected range in `range` mode: `[start]` while the end is being picked, `[start, end]`
   * once both are set. Two-way bindable: `[(range)]`.
   */
  readonly range = model<DateRangeValue | null>(null);
  /**
   * The visible month (any day in it). Defaults to the month of the selection, else today's.
   * Two-way bindable: `[(month)]` reports the first day of the month shown.
   */
  readonly month = model<Date | undefined>(undefined);
  /** Earliest selectable day. */
  readonly min = input<Date | null | undefined>(undefined);
  /** Latest selectable day. */
  readonly max = input<Date | null | undefined>(undefined);
  /** Marks other days unavailable (weekends, holidays, booked dates). */
  readonly isDateUnavailable = input<((date: Date) => boolean) | undefined>(undefined);
  /** First day of the week: 0 = Sunday … 6 = Saturday. @default 0 */
  readonly weekStartsOn = input(0, { transform: numberAttribute });
  /** Locale for month and day names. Defaults to the browser's. */
  readonly locale = input<string | undefined>(undefined);
  /** Nothing can be selected and the month cannot change. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Days can be focused but not selected. */
  readonly readOnly = input(false, { transform: booleanAttribute });
  /** The day marked as today (`aria-current="date"`). Defaults to the current date. */
  readonly today = input<Date | undefined>(undefined);

  /** Id of the heading, which labels the grid. */
  readonly headingId = uniqueId('ds-calendar-heading-');

  readonly todayDate = computed(() => startOfDay(this.today() ?? new Date()));

  private readonly anchor = computed(() =>
    this.mode() === 'range' ? (this.range()?.[0] ?? null) : this.value(),
  );
  private readonly initial = computed(() =>
    clampDay(this.anchor() ?? this.todayDate(), this.min(), this.max()),
  );
  private readonly focusedState = signal<Date | null>(null);

  /** First day of the month shown. */
  readonly visibleMonth = computed(() => startOfMonth(this.month() ?? this.initial()));

  /** The day in the tab order, always inside the visible month. */
  readonly focused = computed(() => {
    const month = this.visibleMonth();
    const focused = this.focusedState() ?? this.initial();
    if (isSameMonth(focused, month)) return focused;
    const months =
      (month.getFullYear() - focused.getFullYear()) * 12 + month.getMonth() - focused.getMonth();
    return clampDay(addMonths(focused, months), this.min(), this.max());
  });

  /** Day under the pointer (or keyboard focus) while a range is half chosen, for the preview. */
  readonly preview = signal<Date | null>(null);

  /** The visible month and year ("March 2026"), for the heading. */
  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(
      this.visibleMonth(),
    ),
  );

  /** Six weeks of seven days covering the visible month. */
  readonly weeks = computed(() => getMonthGrid(this.visibleMonth(), this.weekStartsOn()));

  /** Weekday names in column order. */
  readonly weekdays = computed<CalendarWeekday[]>(() => {
    const short = new Intl.DateTimeFormat(this.locale(), { weekday: 'short' });
    const long = new Intl.DateTimeFormat(this.locale(), { weekday: 'long' });
    return this.weeks()[0].map((date) => ({ short: short.format(date), long: long.format(date) }));
  });

  private readonly dayLabelFormat = computed(
    () =>
      new Intl.DateTimeFormat(this.locale(), {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
  );

  /** The accessible name of a day ("Tuesday, March 10, 2026"). */
  dayLabel(date: Date): string {
    return this.dayLabelFormat().format(date);
  }

  /** Whether a day is outside `min`/`max` or marked unavailable. */
  isUnavailable(date: Date): boolean {
    const min = this.min();
    const max = this.max();
    return (
      (!!min && compareDays(date, min) < 0) ||
      (!!max && compareDays(date, max) > 0) ||
      !!this.isDateUnavailable()?.(date)
    );
  }

  /** Shows the month of `date`. */
  setMonth(date: Date) {
    const first = startOfMonth(date);
    if (!isSameMonth(first, this.visibleMonth())) this.month.set(first);
  }

  /** Makes `date` (kept within the limits) the focusable day, showing its month. */
  setFocused(date: Date) {
    const next = clampDay(date, this.min(), this.max());
    this.focusedState.set(next);
    this.setMonth(next);
  }

  /** Selects a day: the value in single mode, the next end of the range in range mode. */
  select(date: Date) {
    if (this.disabled() || this.readOnly() || this.isUnavailable(date)) return;
    this.setFocused(date);
    this.preview.set(null);
    const day = startOfDay(date);
    if (this.mode() === 'single') {
      this.value.set(day);
      return;
    }
    const [start, end] = this.range() ?? [];
    // A complete (or empty) range starts over; a half range gets its other end, in order.
    if (!start || end) this.range.set([day]);
    else this.range.set(compareDays(day, start) < 0 ? [day, start] : [start, day]);
  }

  /** Whether a range is half chosen (start picked, end not yet). */
  readonly picking = computed(() => {
    const range = this.range();
    return this.mode() === 'range' && !!range?.[0] && !range[1];
  });

  /** Everything a day needs to render. */
  dayState(date: Date): CalendarDayState {
    const mode = this.mode();
    const [rangeStart, rangeEnd] = this.range() ?? [];
    const state: CalendarDayState = {
      date,
      selected:
        mode === 'single'
          ? isSameDay(date, this.value())
          : isSameDay(date, rangeStart) || isSameDay(date, rangeEnd),
      today: isSameDay(date, this.todayDate()),
      outsideMonth: !isSameMonth(date, this.visibleMonth()),
      unavailable: this.isUnavailable(date),
      focused: isSameDay(date, this.focused()),
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
    };
    if (mode === 'range' && rangeStart) {
      // While the end of a range is being chosen, preview it up to the hovered or focused day.
      const otherEnd = rangeEnd ?? (this.picking() ? this.preview() : null) ?? rangeStart;
      const [start, end] =
        compareDays(rangeStart, otherEnd) <= 0 ? [rangeStart, otherEnd] : [otherEnd, rangeStart];
      state.inRange = isBetween(date, start, end);
      state.rangeStart = isSameDay(date, start);
      state.rangeEnd = isSameDay(date, end);
    }
    return state;
  }

  protected readonly flag = dataFlag;
}

/**
 * The visible month and year. Labels the grid and is announced when it changes. Put it on a
 * heading, or on a button that opens a month picker; fill it with the calendar's `monthLabel()`.
 */
@Directive({
  selector: '[dsCalendarHeading]',
  host: { '[id]': 'calendar.headingId', 'aria-live': 'polite' },
})
export class DsCalendarHeading {
  protected readonly calendar = inject(DsCalendar);
}

abstract class CalendarNavButton {
  protected readonly calendar = inject(DsCalendar);
  protected abstract readonly direction: 1 | -1;

  protected readonly target = computed(() =>
    addMonths(this.calendar.visibleMonth(), this.direction),
  );
  /** No month beyond the limits to show. */
  readonly blocked = computed(() => {
    const target = this.target();
    const min = this.calendar.min();
    const max = this.calendar.max();
    if (this.calendar.disabled()) return true;
    if (this.direction === -1)
      return (
        !!min && compareDays(new Date(target.getFullYear(), target.getMonth() + 1, 0), min) < 0
      );
    return !!max && compareDays(target, max) > 0;
  });
  protected readonly flag = dataFlag;

  constructor() {
    injectButtonType();
  }

  protected navigate(event: Event) {
    if (!event.defaultPrevented && !this.blocked()) this.calendar.setMonth(this.target());
  }
}

const NAV_HOST = {
  '[attr.aria-label]': 'label()',
  '[attr.disabled]': 'blocked() ? "" : null',
  '[attr.data-disabled]': 'flag(blocked())',
  '(click)': 'navigate($event)',
};

/** Shows the previous month. Disabled when the month before is entirely before `min`. */
@Directive({ selector: '[dsCalendarPrevButton]', host: NAV_HOST })
export class DsCalendarPrevButton extends CalendarNavButton {
  protected readonly direction = -1;
  /** Accessible name. @default 'Previous month' */
  readonly label = input('Previous month');
}

/** Shows the next month. Disabled when the month after is entirely after `max`. */
@Directive({ selector: '[dsCalendarNextButton]', host: NAV_HOST })
export class DsCalendarNextButton extends CalendarNavButton {
  protected readonly direction = 1;
  /** Accessible name. @default 'Next month' */
  readonly label = input('Next month');
}

/**
 * The month grid (`role="grid"`, on a `<table>`): arrow keys move by day and week, Home/End to
 * the week's ends, PageUp/PageDown by month (with Shift, by year), Enter or Space selects.
 * Render the weekday headers and the weeks from the calendar's `weekdays()` and `weeks()`.
 */
@Directive({
  selector: '[dsCalendarGrid]',
  exportAs: 'dsCalendarGrid',
  host: {
    role: 'grid',
    '[attr.aria-labelledby]': 'calendar.headingId',
    '[attr.aria-readonly]': 'calendar.readOnly() || null',
    '[attr.aria-disabled]': 'calendar.disabled() || null',
    '[attr.aria-multiselectable]': 'calendar.mode() === "range" || null',
    '(keydown)': 'onKeyDown($event)',
    '(pointerleave)': 'calendar.preview.set(null)',
  },
})
export class DsCalendarGrid {
  protected readonly calendar = inject(DsCalendar);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  /** Leave days of the previous and next months empty instead of showing them muted. */
  readonly hideOutsideDays = input(false, { transform: booleanAttribute });

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const calendar = this.calendar;
    const focused = calendar.focused();
    const weekStartsOn = calendar.weekStartsOn();
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      calendar.select(focused);
      return;
    }
    const rtl = getComputedStyle(this.element).direction === 'rtl';
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, rtl ? 1 : -1),
      ArrowRight: () => addDays(focused, rtl ? -1 : 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => startOfWeek(focused, weekStartsOn),
      End: () => addDays(startOfWeek(focused, weekStartsOn), 6),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const next = move();
    calendar.setFocused(next);
    if (calendar.picking()) calendar.preview.set(next);
    // The newly focused day takes DOM focus once it is rendered (possibly in another month).
    afterNextRender(
      () =>
        this.element.querySelector<HTMLElement>('[data-focused]')?.focus({ preventScroll: true }),
      { injector: this.injector },
    );
  }
}

/**
 * A day's cell (`role="gridcell"`, on a `<td>`), selected while its day is (or, in a complete
 * range, lies within the range).
 */
@Directive({
  selector: '[dsCalendarCell]',
  host: { role: 'gridcell', '[attr.aria-selected]': 'selected()' },
})
export class DsCalendarCell {
  private readonly calendar = inject(DsCalendar);
  private readonly grid = inject(DsCalendarGrid, { optional: true });
  /** The cell's day. */
  readonly date = input.required<Date>({ alias: 'dsCalendarCell' });

  protected readonly selected = computed(() => {
    const state = this.calendar.dayState(this.date());
    if (state.outsideMonth && this.grid?.hideOutsideDays()) return null;
    const complete = !!this.calendar.range()?.[1];
    return state.selected || (this.calendar.mode() === 'range' && state.inRange && complete);
  });
}

/**
 * A day's button. Clicking selects it; it is in the tab order while focused. Its state is on
 * `data-selected`, `data-today`, `data-outside-month`, `data-unavailable`, `data-focused`,
 * `data-in-range`, `data-range-start` and `data-range-end`; `state()` has it for rendering.
 */
@Directive({
  selector: '[dsCalendarDay]',
  exportAs: 'dsCalendarDay',
  host: {
    '[attr.tabindex]': 'state().focused ? 0 : -1',
    '[attr.aria-label]': 'label()',
    '[attr.aria-current]': 'state().today ? "date" : null',
    '[attr.aria-disabled]': 'state().unavailable || calendar.disabled() || null',
    '[attr.data-selected]': 'flag(state().selected)',
    '[attr.data-today]': 'flag(state().today)',
    '[attr.data-outside-month]': 'flag(state().outsideMonth)',
    '[attr.data-unavailable]': 'flag(state().unavailable)',
    '[attr.data-focused]': 'flag(state().focused)',
    // An overlay that opens with this calendar moves focus to this day.
    '[attr.data-autofocus]': 'flag(state().focused)',
    '[attr.data-in-range]': 'flag(state().inRange)',
    '[attr.data-range-start]': 'flag(state().rangeStart)',
    '[attr.data-range-end]': 'flag(state().rangeEnd)',
    '(click)': 'onClick($event)',
    '(focus)': 'onFocus()',
    '(pointerenter)': 'calendar.preview.set(date())',
  },
})
export class DsCalendarDay {
  protected readonly calendar = inject(DsCalendar);
  /** The day. */
  readonly date = input.required<Date>({ alias: 'dsCalendarDay' });
  /** The day's state, for rendering. */
  readonly state = computed(() => this.calendar.dayState(this.date()));
  protected readonly label = computed(() => this.calendar.dayLabel(this.date()));
  protected readonly flag = dataFlag;

  constructor() {
    injectButtonType();
  }

  protected onClick(event: Event) {
    if (!event.defaultPrevented) this.calendar.select(this.date());
  }

  protected onFocus() {
    if (!this.state().focused) this.calendar.setFocused(this.date());
  }
}

/** Every calendar part, for `imports: [DsCalendarParts]`. */
export const DsCalendarParts = [
  DsCalendar,
  DsCalendarHeading,
  DsCalendarPrevButton,
  DsCalendarNextButton,
  DsCalendarGrid,
  DsCalendarCell,
  DsCalendarDay,
] as const;
