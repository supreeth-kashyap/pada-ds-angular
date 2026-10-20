import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { InputDateComponent } from './input-date';

const TODAY = new Date(2026, 2, 2);

describe('InputDateComponent', () => {
  it('opens the picker in a dialog on the selected day, picks with the keyboard, and returns focus', async () => {
    const onChange = vi.fn();
    const { fixture } = await render(
      `<ds-input-date label="Due date" locale="en-US" [today]="today" [value]="value" (valueChange)="onChange($event)" />`,
      {
        imports: [InputDateComponent],
        componentProperties: { value: new Date(2026, 2, 10), onChange, today: TODAY },
      },
    );
    const field = screen.getByRole('button', { name: 'Due date 03/10/2026' });
    expect(field).toHaveAttribute('aria-haspopup', 'dialog');
    expect(field).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(field);
    await settle(fixture);
    expect(screen.getByRole('dialog', { name: 'Choose Due date' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /March 10, 2026/ })).toHaveFocus();
    await expectNoA11yViolations(fixture.nativeElement);
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 2, 11));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(field).toHaveFocus();
    expect(field).toHaveTextContent('03/11/2026');
  });

  it('Escape closes without choosing', async () => {
    const onChange = vi.fn();
    const { fixture } = await render(
      `<ds-input-date label="Start" [today]="today" (valueChange)="onChange($event)" />`,
      { imports: [InputDateComponent], componentProperties: { onChange, today: TODAY } },
    );
    const field = screen.getByRole('button', { name: /Start/ });
    expect(field).toHaveTextContent('Select date');
    await userEvent.click(field);
    await settle(fixture);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(field).toHaveFocus();
  });

  it('range: stays open until both ends are picked', async () => {
    const { fixture } = await render(
      `<ds-input-date label="Trip" selection="range" locale="en-US" [today]="today" [(value)]="trip" />`,
      { imports: [InputDateComponent], componentProperties: { trip: null, today: TODAY } },
    );
    const host = fixture.componentInstance as unknown as { trip: unknown };
    await userEvent.click(screen.getByRole('button', { name: /Trip/ }));
    await settle(fixture);
    await userEvent.click(screen.getByRole('button', { name: 'Thursday, March 5, 2026' }));
    await settle(fixture);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trip/ })).toHaveTextContent('03/05/2026 -> ...');
    await userEvent.click(screen.getByRole('button', { name: 'Monday, March 9, 2026' }));
    await settle(fixture);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(host.trip).toEqual([new Date(2026, 2, 5), new Date(2026, 2, 9)]);
    expect(screen.getByRole('button', { name: /Trip/ })).toHaveTextContent(
      '03/05/2026 -> 03/09/2026',
    );
  });

  it('describes the field and shows the error instead', async () => {
    await render(`<ds-input-date label="Due" description="Pick a weekday." [error]="error" />`, {
      imports: [InputDateComponent],
      componentProperties: { error: undefined },
    });
    const field = screen.getByRole('button', { name: /Due/ });
    expect(field).toHaveAccessibleDescription('Pick a weekday.');
    expect(field).not.toHaveAttribute('aria-invalid');
  });

  it('works as a forms control: required, touched on close, disabled', async () => {
    const control = new FormControl<Date | null>(null, Validators.required);
    const { fixture } = await render(
      `<ds-input-date label="Due" error="Pick a date." [today]="today" [formControl]="control" />`,
      {
        imports: [InputDateComponent, ReactiveFormsModule],
        componentProperties: { control, today: TODAY },
      },
    );
    expect(screen.getByText('(required)')).toBeInTheDocument();
    const field = screen.getByRole('button', { name: /Due/ });
    await userEvent.click(field);
    await settle(fixture);
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(control.touched).toBe(true);
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a date.');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    await userEvent.click(field);
    await settle(fixture);
    await userEvent.click(screen.getByRole('button', { name: /March 4, 2026/ }));
    await settle(fixture);
    expect(control.value).toEqual(new Date(2026, 2, 4));
    expect(screen.queryByRole('alert')).toBeNull();
    control.disable();
    await settle(fixture);
    expect(field).toBeDisabled();
  });
});
