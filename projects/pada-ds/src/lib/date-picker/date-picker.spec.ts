import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DatePickerComponent } from './date-picker';

const TODAY = new Date(2026, 2, 2);

describe('DatePickerComponent', () => {
  it('range values from days, and a month view from the heading', async () => {
    const onChange = vi.fn();
    const { fixture } = await render(
      `<ds-date-picker selection="range" [value]="value" (valueChange)="onChange($event)" locale="en-US" [today]="today" />`,
      {
        imports: [DatePickerComponent],
        componentProperties: { value: [new Date(2026, 2, 3)], onChange, today: TODAY },
      },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Friday, March 6, 2026' }));
    await settle(fixture);
    expect(onChange).toHaveBeenLastCalledWith([new Date(2026, 2, 3), new Date(2026, 2, 6)]);
    expect(screen.getByRole('button', { name: 'Thursday, March 5, 2026' })).toHaveAttribute(
      'data-in-range',
    );
    await expectNoA11yViolations(fixture.nativeElement);

    await userEvent.click(screen.getByRole('button', { name: 'March 2026' }));
    await settle(fixture);
    expect(screen.getByRole('button', { name: 'Jan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mar' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Mar' })).toHaveAttribute('data-today');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('navigates month and year views back to the days', async () => {
    const { fixture } = await render(
      `<ds-date-picker [(value)]="value" locale="en-US" [today]="today" />`,
      {
        imports: [DatePickerComponent],
        componentProperties: { value: new Date(2026, 2, 10), today: TODAY },
      },
    );
    await userEvent.click(screen.getByRole('button', { name: 'March 2026' }));
    await settle(fixture);
    await userEvent.click(screen.getByRole('button', { name: '2026' }));
    await settle(fixture);
    expect(screen.getByText('2016 - 2027')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next decade' }));
    await settle(fixture);
    await userEvent.click(screen.getByRole('button', { name: '2030' }));
    await settle(fixture);
    // Picking a year returns to the days of that month.
    expect(screen.getByRole('grid', { name: 'March 2030' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'March 2030' }));
    await settle(fixture);
    await userEvent.click(screen.getByRole('button', { name: 'Previous year' }));
    await settle(fixture);
    await userEvent.click(screen.getByRole('button', { name: 'Jul' }));
    await settle(fixture);
    expect(screen.getByRole('grid', { name: 'July 2029' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Wednesday, July 4, 2029' }));
    await settle(fixture);
    expect((fixture.componentInstance as unknown as { value: Date }).value).toEqual(
      new Date(2029, 6, 4),
    );
  });

  it('month mode picks a month range with a hover preview', async () => {
    const onChange = vi.fn();
    const { fixture } = await render(
      `<ds-date-picker mode="month" selection="range" (valueChange)="onChange($event)" locale="en-US" [today]="today" />`,
      { imports: [DatePickerComponent], componentProperties: { onChange, today: TODAY } },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Feb' }));
    await settle(fixture);
    expect(onChange).toHaveBeenLastCalledWith([new Date(2026, 1, 1)]);
    await userEvent.hover(screen.getByRole('button', { name: 'May' }));
    await settle(fixture);
    expect(screen.getByRole('button', { name: 'Apr' })).toHaveAttribute('data-state', 'hover');
    await userEvent.click(screen.getByRole('button', { name: 'May' }));
    expect(onChange).toHaveBeenLastCalledWith([new Date(2026, 1, 1), new Date(2026, 4, 1)]);
  });

  it('is a forms control', async () => {
    const control = new FormControl<Date | null>(new Date(2026, 2, 10));
    const { fixture } = await render(
      `<ds-date-picker [formControl]="control" locale="en-US" [today]="today" />`,
      {
        imports: [DatePickerComponent, ReactiveFormsModule],
        componentProperties: { control, today: TODAY },
      },
    );
    expect(screen.getByRole('button', { name: 'Tuesday, March 10, 2026' })).toHaveAttribute(
      'data-selected',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Thursday, March 12, 2026' }));
    expect(control.value).toEqual(new Date(2026, 2, 12));
    expect(control.touched).toBe(true);
    control.disable();
    await settle(fixture);
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-disabled', 'true');
  });
});
