import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { TimePickerComponent } from './time-picker';

const spin = (name: string) => screen.getByRole('spinbutton', { name });

describe('TimePickerComponent', () => {
  it('is a labelled, described group of spinbuttons', async () => {
    const { fixture } = await render(
      `<ds-time-picker label="Start time" description="Local time." locale="en-US" value="14:30" />`,
      { imports: [TimePickerComponent] },
    );
    const group = screen.getByRole('group', { name: 'Start time' });
    expect(group).toHaveAccessibleDescription('Local time.');
    expect(spin('Hours')).toHaveTextContent('2');
    expect(spin('Minutes')).toHaveTextContent('30');
    expect(spin('AM/PM')).toHaveTextContent('PM');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('two-way binds, typing and stepping by minuteStep', async () => {
    const { fixture } = await render(
      `<ds-time-picker label="Meeting" locale="en-GB" [minuteStep]="15" [(value)]="time" />`,
      { imports: [TimePickerComponent], componentProperties: { time: null as string | null } },
    );
    const host = fixture.componentInstance as unknown as { time: string | null };
    spin('Hours').focus();
    await userEvent.keyboard('0930');
    await settle(fixture);
    expect(host.time).toBe('09:30');
    await userEvent.keyboard('{ArrowUp}');
    await settle(fixture);
    expect(host.time).toBe('09:45');
    expect(spin('Minutes')).toHaveFocus();
  });

  it('works as a reactive forms control, with required and the error once touched', async () => {
    const control = new FormControl<string | null>(null, Validators.required);
    const { fixture } = await render(
      `<ds-time-picker label="Alarm" granularity="second" [hourCycle]="24" error="Set a time."
         [formControl]="control" />`,
      { imports: [TimePickerComponent, ReactiveFormsModule], componentProperties: { control } },
    );
    expect(screen.getByText('(required)')).toBeInTheDocument();
    expect(spin('Seconds')).toHaveAttribute('aria-required', 'true');
    spin('Hours').focus();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await settle(fixture);
    expect(control.touched).toBe(true);
    expect(screen.getByRole('alert')).toHaveTextContent('Set a time.');

    control.setValue('06:07:08');
    await settle(fixture);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getAllByRole('spinbutton').map((s) => s.textContent)).toEqual([
      '06',
      '07',
      '08',
    ]);
    spin('Seconds').focus();
    await userEvent.keyboard('{Backspace}');
    await settle(fixture);
    expect(control.value).toBeNull();
    // Resetting from the form clears the half-entered time.
    control.reset(null);
    await settle(fixture);
    expect(spin('Hours')).toHaveTextContent('––');
    control.disable();
    await settle(fixture);
    expect(spin('Hours')).toHaveAttribute('aria-disabled', 'true');
  });

  it('marks a time outside min/max invalid, and works with ngModel', async () => {
    const { fixture } = await render(
      `<ds-time-picker label="Opening" locale="en-GB" min="08:00" max="18:00" [(ngModel)]="time" />`,
      { imports: [TimePickerComponent, FormsModule], componentProperties: { time: '19:00' } },
    );
    await settle(fixture);
    expect(spin('Hours')).toHaveAttribute('aria-invalid', 'true');
    spin('Hours').focus();
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    expect((fixture.componentInstance as unknown as { time: string }).time).toBe('18:00');
    expect(spin('Hours')).not.toHaveAttribute('aria-invalid');
  });
});
