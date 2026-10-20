import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import {
  CalendarDayState,
  DsCalendar,
  DsCalendarCell,
  DsCalendarDay,
  DsCalendarGrid,
  DsCalendarHeading,
  DsCalendarNextButton,
  DsCalendarPrevButton,
} from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

const CALENDAR_INPUTS = [
  'mode',
  'value',
  'range',
  'month',
  'min',
  'max',
  'isDateUnavailable',
  'weekStartsOn',
  'locale',
  'disabled',
  'readOnly',
  'today',
];
const CALENDAR_OUTPUTS = ['valueChange', 'rangeChange', 'monthChange'];

/**
 * Custom content for each day button. The context is the day's `CalendarDayState`.
 *
 * ```html
 * <ds-calendar-grid>
 *   <ng-template dsCalendarDayContent let-day>{{ day.date.getDate() }}@if (busy(day.date)) {•}</ng-template>
 * </ds-calendar-grid>
 * ```
 */
@Directive({ selector: 'ng-template[dsCalendarDayContent]' })
export class CalendarDayContentDirective {
  readonly template = inject<TemplateRef<{ $implicit: CalendarDayState }>>(TemplateRef);
  static ngTemplateContextGuard(
    _directive: CalendarDayContentDirective,
    _context: unknown,
  ): _context is { $implicit: CalendarDayState } {
    return true;
  }
}

/** The month and year. Labels the grid and is announced when it changes. */
@Component({
  selector: 'ds-calendar-heading',
  template: '<ng-content>{{ calendar.monthLabel() }}</ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DsCalendarHeading],
  host: { class: 'calendar-heading', role: 'heading', '[attr.aria-level]': 'level()' },
  styles: `
    :host {
      display: block;
      margin: 0;
      padding: var(--pada-space-1) var(--pada-space-3);
      border-radius: var(--pada-radius-xl);
      color: var(--pada-color-fg);
      font-size: var(--pada-font-size-md);
      font-weight: var(--pada-font-weight-semibold);
    }
  `,
})
export class CalendarHeadingComponent {
  protected readonly calendar = inject(DsCalendar);
  /** Heading level announced to assistive technology. @default 2 */
  readonly level = input(2);
}

const NAV_STYLES = `
  :host {
    display: contents;
  }

  .calendar-nav {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--pada-calendar-cell-size);
    height: var(--pada-calendar-cell-size);
    padding: 0;
    border: none;
    border-radius: var(--pada-radius-xl);
    background: none;
    color: var(--pada-color-fg-muted);
    cursor: pointer;
    transition:
      background-color var(--pada-duration-fast) var(--pada-ease-standard),
      color var(--pada-duration-fast) var(--pada-ease-standard);
  }

  .calendar-nav:hover:not(:disabled) {
    background-color: var(--pada-color-neutral-subtle-hover);
    color: var(--pada-color-fg);
  }

  .calendar-nav:disabled {
    color: var(--pada-color-fg-disabled);
    cursor: not-allowed;
  }

  .calendar-nav:focus-visible {
    outline: none;
    box-shadow: var(--pada-shadow-focus);
  }
`;

/** Previous-month button with a chevron (or your own content). */
@Component({
  selector: 'ds-calendar-prev-button',
  imports: [DsCalendarPrevButton, IconComponent],
  template: `
    <button dsCalendarPrevButton class="calendar-nav" [label]="label()">
      <ng-content><ds-icon name="chevron_left" [size]="12" /></ng-content>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: NAV_STYLES,
})
export class CalendarPrevButtonComponent {
  /** Accessible name. @default 'Previous month' */
  readonly label = input('Previous month');
}

/** Next-month button with a chevron (or your own content). */
@Component({
  selector: 'ds-calendar-next-button',
  imports: [DsCalendarNextButton, IconComponent],
  template: `
    <button dsCalendarNextButton class="calendar-nav" [label]="label()">
      <ng-content><ds-icon name="chevron_right" [size]="12" /></ng-content>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: NAV_STYLES,
})
export class CalendarNextButtonComponent {
  /** Accessible name. @default 'Next month' */
  readonly label = input('Next month');
}

/**
 * The day grid. Arrow keys move by day and week, Home/End to the week's ends, PageUp/PageDown by
 * month (Shift: by year), Enter or Space selects. Customise the day buttons' content with an
 * `ng-template dsCalendarDayContent`.
 */
@Component({
  selector: 'ds-calendar-grid',
  imports: [DsCalendarGrid, DsCalendarCell, DsCalendarDay, NgTemplateOutlet],
  templateUrl: './calendar-grid.html',
  styleUrl: './calendar-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarGridComponent {
  protected readonly calendar = inject(DsCalendar);
  /** Leave days of the previous and next months empty instead of showing them muted. */
  readonly hideOutsideDays = input(false, { transform: booleanAttribute });
  protected readonly dayContent = contentChild(CalendarDayContentDirective);

  protected readonly weeks = computed(() => {
    const month = this.calendar.visibleMonth().getMonth();
    const hide = this.hideOutsideDays();
    return this.calendar.weeks().map((week) => ({
      key: week[0].getTime(),
      days: week.map((date) => ({
        date,
        key: date.getTime(),
        hidden: hide && date.getMonth() !== month,
      })),
    }));
  });
}

/**
 * Holds the selection, the visible month and the limits, for a calendar you compose yourself
 * from `ds-calendar-prev-button`, `ds-calendar-heading`, `ds-calendar-next-button` and
 * `ds-calendar-grid`. Takes the same inputs as `ds-calendar`.
 *
 * ```html
 * <ds-calendar-root mode="range" [(range)]="stay">
 *   <div class="my-header">
 *     <ds-calendar-prev-button />
 *     <ds-calendar-heading />
 *     <ds-calendar-next-button />
 *   </div>
 *   <ds-calendar-grid hideOutsideDays />
 * </ds-calendar-root>
 * ```
 */
@Component({
  selector: 'ds-calendar-root',
  template: '<ng-content />',
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsCalendar, inputs: CALENDAR_INPUTS, outputs: CALENDAR_OUTPUTS }],
})
export class CalendarRootComponent {}

/**
 * A month calendar for picking a day or a range (WAI-ARIA APG date grid). Arrow keys move by
 * day and week, Home/End to the week's ends, PageUp/PageDown by month (Shift: by year).
 *
 * ```html
 * <ds-calendar [(value)]="due" [min]="today" />
 * <ds-calendar mode="range" [(range)]="stay" [isDateUnavailable]="isBooked" [weekStartsOn]="1" />
 * ```
 *
 * Inputs (from the headless `DsCalendar`): `mode` (`single` | `range`), `value` and `range`
 * (two-way), `month` (two-way, the visible month), `min`, `max`, `isDateUnavailable`,
 * `weekStartsOn`, `locale`, `disabled`, `readOnly`, `today`. Outputs: `valueChange`,
 * `rangeChange`, `monthChange`.
 *
 * Differences from React: the single value and the range are separate models (`value` and
 * `range`) so each is typed for two-way binding; a one-way binding replaces the `default*`
 * props; `today` is an input (it defaults to the current date). For a custom header use
 * `ds-calendar-root` with the parts instead of children.
 */
@Component({
  selector: 'ds-calendar',
  imports: [
    CalendarPrevButtonComponent,
    CalendarHeadingComponent,
    CalendarNextButtonComponent,
    CalendarGridComponent,
  ],
  template: `
    <div class="calendar-header">
      <ds-calendar-prev-button />
      <ds-calendar-heading />
      <ds-calendar-next-button />
    </div>
    <ds-calendar-grid />
  `,
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsCalendar, inputs: CALENDAR_INPUTS, outputs: CALENDAR_OUTPUTS }],
})
export class CalendarComponent {}

/** Every calendar part, for `imports: [...CalendarParts]`. */
export const CalendarParts = [
  CalendarComponent,
  CalendarRootComponent,
  CalendarHeadingComponent,
  CalendarPrevButtonComponent,
  CalendarNextButtonComponent,
  CalendarGridComponent,
  CalendarDayContentDirective,
] as const;
