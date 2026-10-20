import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DsCalendarParts } from './calendar.directive';
import { addMonths, getMonthGrid } from './dates';

const TEMPLATE = `
  <div
    dsCalendar
    #cal="dsCalendar"
    locale="en-US"
    [today]="today"
    [mode]="mode"
    [(value)]="value"
    [(range)]="range"
    [month]="month"
    [min]="min"
    [max]="max"
    [isDateUnavailable]="unavailable"
    (valueChange)="onValue($event)"
    (rangeChange)="onRange($event)"
  >
    <button dsCalendarPrevButton>‹</button>
    <h2 dsCalendarHeading>{{ cal.monthLabel() }}</h2>
    <button dsCalendarNextButton>›</button>
    <table dsCalendarGrid>
      <thead>
        <tr>
          @for (weekday of cal.weekdays(); track weekday.long) {
            <th scope="col" [attr.abbr]="weekday.long">{{ weekday.short }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (week of cal.weeks(); track week[0].getTime()) {
          <tr>
            @for (date of week; track date.getTime()) {
              <td [dsCalendarCell]="date">
                <button [dsCalendarDay]="date">{{ date.getDate() }}</button>
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
  </div>
`;

interface Props {
  mode?: 'single' | 'range';
  value?: Date | null;
  range?: [Date, Date?] | null;
  month?: Date;
  min?: Date;
  max?: Date;
  unavailable?: (date: Date) => boolean;
}

async function setup(props: Props = {}) {
  const onValue = vi.fn();
  const onRange = vi.fn();
  const result = await render(TEMPLATE, {
    imports: [...DsCalendarParts],
    componentProperties: {
      mode: 'single',
      value: null,
      range: null,
      month: undefined,
      min: undefined,
      max: undefined,
      unavailable: undefined,
      today: new Date(2026, 2, 2),
      ...props,
      onValue,
      onRange,
    },
  });
  return { ...result, onValue, onRange };
}

const day = (name: string) => screen.getByRole('button', { name });

describe('DsCalendar', () => {
  it('is a grid labelled by the month, with one focusable day', async () => {
    const { fixture } = await setup({ value: new Date(2026, 2, 10) });
    const grid = screen.getByRole('grid', { name: 'March 2026' });
    expect(within(grid).getAllByRole('columnheader')[0]).toHaveAttribute('abbr', 'Sunday');
    const selected = day('Tuesday, March 10, 2026');
    expect(selected).toHaveAttribute('tabindex', '0');
    expect(selected).toHaveAttribute('type', 'button');
    expect(selected.closest('td')).toHaveAttribute('aria-selected', 'true');
    expect(day('Monday, March 2, 2026')).toHaveAttribute('aria-current', 'date');
    expect(day('Monday, March 2, 2026')).toHaveAttribute('data-today');
    expect(day('Sunday, March 1, 2026')).not.toHaveAttribute('data-outside-month');
    expect(day('Wednesday, April 1, 2026')).toHaveAttribute('data-outside-month');
    expect(
      within(grid)
        .getAllByRole('button')
        .filter((button) => button.tabIndex === 0),
    ).toHaveLength(1);
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('moves by day, week and month with the keyboard and selects with Enter', async () => {
    const { fixture, onValue } = await setup({ value: new Date(2026, 2, 31) });
    day('Tuesday, March 31, 2026').focus();
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    // Crossing into April shows April and keeps focus on the new day.
    expect(screen.getByRole('grid', { name: 'April 2026' })).toBeInTheDocument();
    expect(day('Wednesday, April 1, 2026')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    expect(day('Wednesday, April 8, 2026')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}{ArrowUp}');
    await settle(fixture);
    expect(day('Tuesday, March 31, 2026')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{Home}');
    await settle(fixture);
    expect(day('Sunday, April 5, 2026')).toHaveFocus();
    await userEvent.keyboard('{End}');
    await settle(fixture);
    expect(day('Saturday, April 11, 2026')).toHaveFocus();
    await userEvent.keyboard('{PageDown}');
    await settle(fixture);
    expect(day('Monday, May 11, 2026')).toHaveFocus();
    await userEvent.keyboard('{PageUp}');
    await settle(fixture);
    expect(day('Saturday, April 11, 2026')).toHaveFocus();
    await userEvent.keyboard('{PageDown}{Shift>}{PageUp}{/Shift}');
    await settle(fixture);
    expect(day('Sunday, May 11, 2025')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(onValue).toHaveBeenLastCalledWith(new Date(2025, 4, 11));
    expect(day('Sunday, May 11, 2025').closest('td')).toHaveAttribute('aria-selected', 'true');
  });

  it('pages months with the buttons, and Space selects', async () => {
    const { fixture, onValue } = await setup({ month: new Date(2026, 2, 1) });
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    await settle(fixture);
    expect(screen.getByRole('heading', { name: 'April 2026' })).toHaveAttribute('aria-live');
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    await settle(fixture);
    expect(screen.getByRole('grid', { name: 'February 2026' })).toBeInTheDocument();
    // The tab stop stays in the visible month.
    expect(day('Monday, February 2, 2026')).toHaveAttribute('tabindex', '0');
    day('Monday, February 2, 2026').focus();
    await userEvent.keyboard(' ');
    expect(onValue).toHaveBeenLastCalledWith(new Date(2026, 1, 2));
  });

  it('respects min, max and unavailable days', async () => {
    const { fixture, onValue } = await setup({
      month: new Date(2026, 2, 1),
      min: new Date(2026, 2, 5),
      max: new Date(2026, 2, 20),
      unavailable: (date: Date) => date.getDay() === 0,
    });
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    await userEvent.click(day('Wednesday, March 4, 2026'));
    await userEvent.click(day('Sunday, March 8, 2026'));
    await settle(fixture);
    expect(day('Sunday, March 8, 2026')).toHaveAttribute('aria-disabled', 'true');
    expect(day('Sunday, March 8, 2026')).toHaveAttribute('data-unavailable');
    expect(onValue).not.toHaveBeenCalled();
    await userEvent.click(day('Monday, March 9, 2026'));
    expect(onValue).toHaveBeenCalledWith(new Date(2026, 2, 9));
    // Keyboard focus stops at the limits.
    await settle(fixture);
    day('Monday, March 9, 2026').focus();
    await userEvent.keyboard('{PageDown}');
    await settle(fixture);
    expect(day('Friday, March 20, 2026')).toHaveFocus();
  });

  it('range: two clicks pick the ends in order, with a preview in between', async () => {
    const { fixture, onRange } = await setup({ mode: 'range', month: new Date(2026, 2, 1) });
    expect(screen.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true');
    await userEvent.click(day('Friday, March 20, 2026'));
    await settle(fixture);
    expect(onRange).toHaveBeenLastCalledWith([new Date(2026, 2, 20)]);
    await userEvent.hover(day('Monday, March 16, 2026'));
    await settle(fixture);
    expect(day('Wednesday, March 18, 2026')).toHaveAttribute('data-in-range');
    // A half range is not selected yet, only previewed.
    expect(day('Wednesday, March 18, 2026').closest('td')).toHaveAttribute(
      'aria-selected',
      'false',
    );
    await userEvent.click(day('Monday, March 16, 2026'));
    await settle(fixture);
    expect(onRange).toHaveBeenLastCalledWith([new Date(2026, 2, 16), new Date(2026, 2, 20)]);
    expect(day('Monday, March 16, 2026')).toHaveAttribute('data-range-start');
    expect(day('Friday, March 20, 2026')).toHaveAttribute('data-range-end');
    expect(day('Wednesday, March 18, 2026').closest('td')).toHaveAttribute('aria-selected', 'true');
    // A third click starts over.
    await userEvent.click(day('Tuesday, March 24, 2026'));
    expect(onRange).toHaveBeenLastCalledWith([new Date(2026, 2, 24)]);
  });

  it('range: the keyboard previews the other end', async () => {
    const { fixture, onRange } = await setup({
      mode: 'range',
      range: [new Date(2026, 2, 10)],
    });
    day('Tuesday, March 10, 2026').focus();
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    expect(day('Friday, March 13, 2026')).toHaveAttribute('data-in-range');
    expect(day('Tuesday, March 17, 2026')).toHaveAttribute('data-range-end');
    await userEvent.keyboard('{Enter}');
    expect(onRange).toHaveBeenLastCalledWith([new Date(2026, 2, 10), new Date(2026, 2, 17)]);
  });

  it('date helpers', () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
    const grid = getMonthGrid(new Date(2026, 2, 1), 1);
    expect(grid).toHaveLength(6);
    expect(grid[0][0]).toEqual(new Date(2026, 1, 23));
  });
});
