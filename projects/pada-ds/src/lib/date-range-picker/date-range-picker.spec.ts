import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DateRange, DateRangePickerComponent, DateRangePreset } from './date-range-picker';

const TODAY = new Date(2026, 2, 2);
const day = (name: string) => screen.getByRole('button', { name });

describe('DateRangePickerComponent', () => {
  it('opens two months in a dialog, picks start then end, and returns focus', async () => {
    const onChange = vi.fn();
    const { fixture } = await render(
      `<ds-date-range-picker label="Stay" locale="en-US" [today]="today" [value]="value" (valueChange)="onChange($event)" />`,
      {
        imports: [DateRangePickerComponent],
        componentProperties: {
          value: [new Date(2026, 2, 3), new Date(2026, 2, 6)],
          onChange,
          today: TODAY,
        },
      },
    );
    const field = screen.getByRole('button', { name: /^Stay Mar 3\s–\s6, 2026$/ });
    expect(field).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(field);
    await settle(fixture);
    expect(screen.getByRole('dialog', { name: 'Choose Stay' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'April 2026' })).toBeInTheDocument();
    expect(day('Tuesday, March 3, 2026')).toHaveFocus();
    expect(day('Wednesday, March 4, 2026')).toHaveAttribute('data-in-range');
    await expectNoA11yViolations(fixture.nativeElement);

    // A new start: the value waits for the end.
    await userEvent.click(day('Monday, March 30, 2026'));
    await settle(fixture);
    expect(onChange).not.toHaveBeenCalled();
    // The end, with the keyboard, in the second month.
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await settle(fixture);
    expect(onChange).toHaveBeenCalledWith([new Date(2026, 2, 30), new Date(2026, 3, 6)]);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(field).toHaveFocus();
    expect(field).toHaveTextContent(/Mar 30\s–\sApr 6, 2026/);
  });

  it('Escape drops a half-picked range and keeps the value', async () => {
    const onChange = vi.fn();
    const { fixture } = await render(
      `<ds-date-range-picker label="Stay" locale="en-US" [today]="today" (valueChange)="onChange($event)" />`,
      { imports: [DateRangePickerComponent], componentProperties: { onChange, today: TODAY } },
    );
    const field = screen.getByRole('button', { name: /Stay/ });
    expect(field).toHaveTextContent('Select dates');
    await userEvent.click(field);
    await settle(fixture);
    await userEvent.click(day('Tuesday, March 10, 2026'));
    await settle(fixture);
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(field);
    await settle(fixture);
    expect(day('Tuesday, March 10, 2026')).not.toHaveAttribute('data-selected');
  });

  it('picks a preset', async () => {
    const presets: DateRangePreset[] = [
      { label: 'Last 7 days', range: [new Date(2026, 1, 24), new Date(2026, 2, 2)] },
      { label: 'This month', range: [new Date(2026, 2, 1), new Date(2026, 2, 31)] },
    ];
    const { fixture } = await render(
      `<ds-date-range-picker label="Period" locale="en-US" [today]="today" [presets]="presets" [(value)]="value" />`,
      {
        imports: [DateRangePickerComponent],
        componentProperties: { presets, today: TODAY, value: null as DateRange | null },
      },
    );
    await userEvent.click(screen.getByRole('button', { name: /Period/ }));
    await settle(fixture);
    expect(screen.getByRole('list', { name: 'Presets' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'This month' }));
    await settle(fixture);
    const host = fixture.componentInstance as unknown as { value: DateRange };
    expect(host.value).toEqual(presets[1].range);
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Period/ }));
    await settle(fixture);
    expect(screen.getByRole('button', { name: 'This month' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('respects min and max, and is a forms control', async () => {
    const control = new FormControl<DateRange | null>(null, Validators.required);
    const { fixture } = await render(
      `<ds-date-range-picker label="Trip" locale="en-US" error="Pick your dates." [today]="today"
         [minDate]="min" [maxDate]="max" [formControl]="control" />`,
      {
        imports: [DateRangePickerComponent, ReactiveFormsModule],
        componentProperties: {
          control,
          today: TODAY,
          min: new Date(2026, 2, 5),
          max: new Date(2026, 3, 10),
        },
      },
    );
    const field = screen.getByRole('button', { name: /Trip/ });
    expect(screen.getByText('(required)')).toBeInTheDocument();
    await userEvent.click(field);
    await settle(fixture);
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    expect(day('Wednesday, March 4, 2026')).toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(control.touched).toBe(true);
    expect(screen.getByRole('alert')).toHaveTextContent('Pick your dates.');
    expect(field).toHaveAttribute('aria-invalid', 'true');

    control.setValue([new Date(2026, 2, 10), new Date(2026, 2, 12)]);
    await settle(fixture);
    expect(field).toHaveTextContent(/Mar 10\s–\s12, 2026/);
    control.disable();
    await settle(fixture);
    expect(field).toBeDisabled();
  });
});
