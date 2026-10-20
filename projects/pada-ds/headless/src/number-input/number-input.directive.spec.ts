import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { DsFieldParts } from '../field/field.directive';
import { createNumberFormatter, roundToPrecision } from './number-format';
import { DsNumberInputParts } from './number-input.directive';

const example = (attributes: string) => `
  <div dsNumberInput ${attributes}>
    <button dsNumberInputDecrement>−</button>
    <input dsNumberInputInput aria-label="Quantity" />
    <button dsNumberInputIncrement>+</button>
  </div>`;

describe('DsNumberInput', () => {
  afterEach(() => vi.useRealTimers());

  it('is a spinbutton with its value and limits', async () => {
    const { container } = await render(example('[value]="3" [min]="0" [max]="10"'), {
      imports: [...DsNumberInputParts],
    });
    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    expect(input).toHaveValue('3');
    expect(input).toHaveAttribute('aria-valuenow', '3');
    expect(input).toHaveAttribute('aria-valuemin', '0');
    expect(input).toHaveAttribute('aria-valuemax', '10');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    const increase = screen.getByRole('button', { name: 'Increase' });
    expect(increase).toHaveAttribute('tabindex', '-1');
    expect(increase).toHaveAttribute('aria-controls', input.id);
    await expectNoA11yViolations(container);
  });

  it('steps with the keyboard and stays within the limits', async () => {
    const onValueChange = vi.fn();
    await render(
      example(
        '[value]="0.1" [step]="0.1" [min]="0" [max]="1" (valueChange)="onValueChange($event)"',
      ),
      { imports: [...DsNumberInputParts], componentProperties: { onValueChange } },
    );
    const input = screen.getByRole('spinbutton');
    input.focus();
    await userEvent.keyboard('{ArrowUp}');
    // 0.1 + 0.1 without floating-point noise.
    expect(onValueChange).toHaveBeenLastCalledWith(0.2);
    await userEvent.keyboard('{ArrowUp}');
    expect(onValueChange).toHaveBeenLastCalledWith(0.3);
    await userEvent.keyboard('{PageUp}');
    expect(onValueChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled();
    await userEvent.keyboard('{Home}');
    expect(onValueChange).toHaveBeenLastCalledWith(0);
    await userEvent.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-valuenow', '0');
    await userEvent.keyboard('{End}{PageDown}');
    expect(onValueChange).toHaveBeenLastCalledWith(0);
  });

  it('commits typed text on Enter and blur, parsed in the locale and clamped', async () => {
    const onValueChange = vi.fn();
    await render(example('locale="de-DE" [max]="5000" (valueChange)="onValueChange($event)"'), {
      imports: [...DsNumberInputParts],
      componentProperties: { onValueChange },
    });
    const input = screen.getByRole('spinbutton');
    await userEvent.type(input, '1.234,5{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(1234.5);
    expect(input).toHaveValue('1.234,5');
    await userEvent.clear(input);
    await userEvent.type(input, '99999');
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(5000);
    expect(input).toHaveValue('5.000');
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it('steppers step once on press and repeat while held', async () => {
    const onValueChange = vi.fn();
    await render(example('[value]="0" (valueChange)="onValueChange($event)"'), {
      imports: [...DsNumberInputParts],
      componentProperties: { onValueChange },
    });
    vi.useFakeTimers();
    const increase = screen.getByRole('button', { name: 'Increase' });
    fireEvent.pointerDown(increase, { button: 0 });
    expect(onValueChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole('spinbutton')).toHaveFocus();
    vi.advanceTimersByTime(400 + 60 * 2);
    expect(onValueChange).toHaveBeenLastCalledWith(4);
    fireEvent.pointerUp(increase);
    vi.advanceTimersByTime(1000);
    expect(onValueChange).toHaveBeenLastCalledWith(4);
    // A click without a pointer (assistive technology) steps too.
    fireEvent.click(screen.getByRole('button', { name: 'Decrease' }), { detail: 0 });
    expect(onValueChange).toHaveBeenLastCalledWith(3);
  });

  it('takes the field id and submits the raw number', async () => {
    const { container } = await render(
      `<form><div dsField>
         <label dsFieldLabel>Budget</label>
         <div dsNumberInput [value]="1200" name="budget" locale="en-US"
              [formatOptions]="{ style: 'currency', currency: 'USD' }">
           <input dsNumberInputInput dsFieldControl />
         </div>
         <p dsFieldDescription>Per month.</p>
       </div></form>`,
      { imports: [...DsNumberInputParts, ...DsFieldParts] },
    );
    const input = screen.getByRole('spinbutton', { name: 'Budget' });
    expect(input).toHaveValue('$1,200.00');
    expect(input).toHaveAttribute('aria-valuetext', '$1,200.00');
    expect(input).toHaveAccessibleDescription('Per month.');
    expect(new FormData(container.querySelector('form')!).get('budget')).toBe('1200');
  });

  it('works with reactive forms and ngModel', async () => {
    const control = new FormControl<number | null>(5);
    const { fixture } = await render(
      `<div dsNumberInput [formControl]="control"><input dsNumberInputInput aria-label="A" /></div>
       <div dsNumberInput [(ngModel)]="amount"><input dsNumberInputInput aria-label="B" /></div>`,
      {
        imports: [...DsNumberInputParts, ReactiveFormsModule, FormsModule],
        componentProperties: { control, amount: 7 },
      },
    );
    await fixture.whenStable();
    const a = screen.getByRole('spinbutton', { name: 'A' });
    expect(a).toHaveValue('5');
    a.focus();
    await userEvent.keyboard('{ArrowUp}');
    await userEvent.tab();
    expect(control.value).toBe(6);
    expect(control.touched).toBe(true);
    control.setValue(42);
    await fixture.whenStable();
    expect(a).toHaveValue('42');
    control.disable();
    await fixture.whenStable();
    expect(a).toBeDisabled();

    const b = screen.getByRole('spinbutton', { name: 'B' });
    expect(b).toHaveValue('7');
    await userEvent.type(b, '0{Enter}');
    expect((fixture.componentInstance as unknown as { amount: number }).amount).toBe(70);
  });

  it('formats currency and percent, and parses them back', () => {
    const euro = createNumberFormatter('en-US', { style: 'currency', currency: 'EUR' });
    expect(euro.format(1234.5)).toBe('€1,234.50');
    expect(euro.parse('€1,234.50')).toBe(1234.5);
    expect(euro.parse('-€3')).toBe(-3);
    const percent = createNumberFormatter('en-US', { style: 'percent' });
    expect(percent.parse('25%')).toBe(0.25);
    expect(percent.parse('abc')).toBeNull();
    expect(roundToPrecision(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(roundToPrecision(3.14159, 1)).toBe(3.14159);
  });
});
