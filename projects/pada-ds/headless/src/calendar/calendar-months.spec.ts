import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DsCalendarParts } from './calendar.directive';

// Two months side by side: one root, one heading and one grid per month (`monthOffset`).
const TEMPLATE = `
  <div
    dsCalendar
    #cal="dsCalendar"
    locale="en-US"
    mode="range"
    numberOfMonths="2"
    [today]="today"
    [(range)]="range"
    [month]="month"
    [max]="max"
  >
    <button dsCalendarPrevButton>‹</button>
    <button dsCalendarNextButton>›</button>
    @for (offset of [0, 1]; track offset) {
      <h2 dsCalendarHeading [monthOffset]="offset">{{ cal.monthLabelAt(offset) }}</h2>
      <table dsCalendarGrid [monthOffset]="offset" hideOutsideDays>
        <tbody>
          @for (week of cal.weeksAt(offset); track week[0].getTime()) {
            <tr>
              @for (date of week; track date.getTime()) {
                <td [dsCalendarCell]="date">
                  @if (date.getMonth() === cal.monthAt(offset).getMonth()) {
                    <button [dsCalendarDay]="date">{{ date.getDate() }}</button>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    }
  </div>
`;

async function setup(props: { range?: [Date, Date?] | null; max?: Date } = {}) {
  return render(TEMPLATE, {
    imports: [...DsCalendarParts],
    componentProperties: {
      today: new Date(2026, 2, 2),
      month: new Date(2026, 2, 1),
      range: null,
      max: undefined,
      ...props,
    },
  });
}

const day = (name: string) => screen.getByRole('button', { name });

describe('DsCalendar with several months', () => {
  it('labels each grid by its own month, with one tab stop across both', async () => {
    const { fixture } = await setup();
    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'April 2026' })).toBeInTheDocument();
    const tabStops = screen.getAllByRole('button').filter((b) => b.getAttribute('tabindex') === '0');
    expect(tabStops).toEqual([day('Monday, March 2, 2026')]);
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('moves focus from one grid into the next and only scrolls past the last month', async () => {
    const { fixture } = await setup();
    day('Tuesday, March 31, 2026').focus();
    await settle(fixture);
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    // April is already shown: focus crosses grids, the months stay.
    expect(day('Wednesday, April 1, 2026')).toHaveFocus();
    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeInTheDocument();
    await userEvent.keyboard('{PageDown}');
    await settle(fixture);
    expect(day('Friday, May 1, 2026')).toHaveFocus();
    expect(screen.getByRole('grid', { name: 'April 2026' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'May 2026' })).toBeInTheDocument();
    await userEvent.keyboard('{Shift>}{PageUp}{/Shift}');
    await settle(fixture);
    expect(day('Thursday, May 1, 2025')).toHaveFocus();
    expect(screen.getByRole('grid', { name: 'May 2025' })).toBeInTheDocument();
  });

  it('picks a range across the two months, previewing it on hover', async () => {
    const { fixture } = await setup();
    await userEvent.click(day('Friday, March 27, 2026'));
    await settle(fixture);
    await userEvent.hover(day('Friday, April 3, 2026'));
    await settle(fixture);
    expect(day('Tuesday, March 31, 2026')).toHaveAttribute('data-in-range');
    expect(day('Wednesday, April 1, 2026')).toHaveAttribute('data-in-range');
    await userEvent.click(day('Friday, April 3, 2026'));
    await settle(fixture);
    const { range } = fixture.componentInstance as unknown as { range: Date[] };
    expect(range).toEqual([new Date(2026, 2, 27), new Date(2026, 3, 3)]);
    expect(day('Friday, March 27, 2026')).toHaveAttribute('data-range-start');
    expect(day('Friday, April 3, 2026')).toHaveAttribute('data-range-end');
  });

  it('blocks Next once the last month shown reaches max', async () => {
    await setup({ max: new Date(2026, 3, 20) });
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });
});
