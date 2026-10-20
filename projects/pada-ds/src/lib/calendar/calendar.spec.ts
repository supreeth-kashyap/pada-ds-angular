import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { CalendarParts } from './calendar';

const TODAY = new Date(2026, 2, 2);

describe('CalendarComponent', () => {
  it('renders a header and grid with styled days', async () => {
    const { fixture } = await render(
      `<ds-calendar locale="en-US" [today]="today" [value]="value" />`,
      {
        imports: [...CalendarParts],
        componentProperties: { today: TODAY, value: new Date(2026, 2, 10) },
      },
    );
    expect(screen.getByRole('heading', { name: 'March 2026' })).toHaveClass('calendar-heading');
    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeInTheDocument();
    const day = screen.getByRole('button', { name: 'Tuesday, March 10, 2026' });
    expect(day).toHaveClass('calendar-day');
    expect(day).toHaveAttribute('data-selected');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('two-way binds the value and the visible month', async () => {
    const { fixture } = await render(
      `<ds-calendar locale="en-US" [today]="today" [(value)]="value" [(month)]="month" />`,
      {
        imports: [...CalendarParts],
        componentProperties: { today: TODAY, value: null, month: undefined },
      },
    );
    const host = fixture.componentInstance as unknown as { value: Date | null; month?: Date };
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    await settle(fixture);
    expect(host.month).toEqual(new Date(2026, 3, 1));
    await userEvent.click(screen.getByRole('button', { name: 'Friday, April 17, 2026' }));
    await settle(fixture);
    expect(host.value).toEqual(new Date(2026, 3, 17));
  });

  it('composes a custom header, hides outside days and renders custom day content', async () => {
    const { fixture } = await render(
      `<ds-calendar-root locale="en-US" [today]="today" mode="range" [range]="range">
         <ds-calendar-prev-button label="Earlier" />
         <ds-calendar-heading>Pick your stay</ds-calendar-heading>
         <ds-calendar-next-button />
         <ds-calendar-grid hideOutsideDays>
           <ng-template dsCalendarDayContent let-day>
             <span class="d">{{ day.date.getDate() }}{{ day.inRange ? '*' : '' }}</span>
           </ng-template>
         </ds-calendar-grid>
       </ds-calendar-root>`,
      {
        imports: [...CalendarParts],
        componentProperties: { today: TODAY, range: [new Date(2026, 2, 3), new Date(2026, 2, 5)] },
      },
    );
    expect(screen.getByRole('grid', { name: 'Pick your stay' })).toHaveAttribute(
      'aria-multiselectable',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Earlier' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Wednesday, April 1, 2026' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Wednesday, March 4, 2026' })).toHaveTextContent(
      '4*',
    );
    await expectNoA11yViolations(fixture.nativeElement);
  });
});
