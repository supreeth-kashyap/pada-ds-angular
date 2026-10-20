import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { NumberInputComponent } from './number-input';

describe('NumberInputComponent', () => {
  it('wires label, description and error to the spinbutton', async () => {
    const { container } = await render(
      `<ds-number-input label="Seats" description="Up to 50." error="Too many" required [value]="60" />`,
      { imports: [NumberInputComponent] },
    );
    const input = screen.getByRole('spinbutton', { name: /Seats/ });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Up to 50. Too many');
    expect(screen.getAllByRole('button')).toHaveLength(2);
    await expectNoA11yViolations(container);
  });

  it('formats currency, steps, and submits the raw number', async () => {
    const { container } = await render(
      `<form><ds-number-input label="Budget" name="budget" locale="en-US" [step]="100" [value]="1200"
         [formatOptions]="{ style: 'currency', currency: 'USD' }" /></form>`,
      { imports: [NumberInputComponent] },
    );
    const input = screen.getByRole('spinbutton', { name: 'Budget' });
    expect(input).toHaveValue('$1,200.00');
    input.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(input).toHaveValue('$1,300.00');
    await userEvent.keyboard('{PageDown}');
    expect(input).toHaveValue('$300.00');
    expect(new FormData(container.querySelector('form')!).get('budget')).toBe('300');
  });

  it('split steppers sit on both sides and stop at the limit', async () => {
    const { container } = await render(
      `<ds-number-input label="Guests" stepper="split" [value]="2" [min]="1" />`,
      { imports: [NumberInputComponent] },
    );
    const [decrease, increase] = screen.getAllByRole('button');
    expect(decrease).toHaveAccessibleName('Decrease');
    expect(increase).toHaveAccessibleName('Increase');
    expect(container.querySelector('.number-input')).toHaveAttribute('data-stepper', 'split');
    await userEvent.click(decrease);
    expect(screen.getByRole('spinbutton')).toHaveValue('1');
    expect(decrease).toBeDisabled();
  });

  it('works with reactive forms: typed text, touched errors and disabled', async () => {
    const control = new FormControl<number | null>(null, [Validators.required, Validators.max(10)]);
    const { fixture } = await render(
      `<ds-number-input label="Quantity" stepper="none" error="1 to 10." [formControl]="control" />`,
      { imports: [NumberInputComponent, ReactiveFormsModule], componentProperties: { control } },
    );
    const input = screen.getByRole('spinbutton', { name: /Quantity/ });
    expect(input).toBeRequired();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    await userEvent.type(input, '12');
    await userEvent.tab();
    expect(control.value).toBe(12);
    expect(control.touched).toBe(true);
    expect(screen.getByRole('alert')).toHaveTextContent('1 to 10.');
    control.setValue(4);
    await fixture.whenStable();
    expect(input).toHaveValue('4');
    expect(screen.queryByRole('alert')).toBeNull();
    control.disable();
    await fixture.whenStable();
    expect(input).toBeDisabled();
  });

  it('works with ngModel', async () => {
    const { fixture } = await render(`<ds-number-input label="Count" [(ngModel)]="count" />`, {
      imports: [NumberInputComponent, FormsModule],
      componentProperties: { count: 3 },
    });
    await fixture.whenStable();
    const input = screen.getByRole('spinbutton', { name: 'Count' });
    expect(input).toHaveValue('3');
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect((fixture.componentInstance as unknown as { count: number }).count).toBe(2);
  });
});
