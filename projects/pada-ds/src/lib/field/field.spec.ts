import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { FieldParts } from './field';

describe('Field', () => {
  it('wires the label, description and error to the control', async () => {
    const { container, rerender } = await render(
      `<ds-field [invalid]="invalid" required>
         <ds-field-label>Email</ds-field-label>
         <input dsInput dsFieldControl type="email" />
         <ds-field-description>We never share it.</ds-field-description>
         <ds-field-error>Enter a valid email address.</ds-field-error>
       </ds-field>`,
      { imports: [...FieldParts], componentProperties: { invalid: false } },
    );
    const input = screen.getByLabelText(/Email/);
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription('We never share it.');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('alert')).toBeNull();
    await expectNoA11yViolations(container);

    await rerender({ componentProperties: { invalid: true } });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(input).toHaveAccessibleDescription('We never share it. Enter a valid email address.');
    expect(container.querySelector('ds-field')).toHaveAttribute('data-invalid');
  });

  it('follows a reactive forms control: required, disabled, and invalid once touched', async () => {
    const control = new FormControl('', Validators.required);
    await render(
      `<ds-field>
         <ds-field-label>Name</ds-field-label>
         <input dsInput dsFieldControl [formControl]="control" />
         <ds-field-error>Name is required.</ds-field-error>
       </ds-field>`,
      { imports: [...FieldParts, ReactiveFormsModule], componentProperties: { control } },
    );
    const input = screen.getByLabelText(/Name/);
    expect(input).toBeRequired();
    expect(screen.queryByRole('alert')).toBeNull();

    await userEvent.click(input);
    await userEvent.tab();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required.');

    await userEvent.type(input, 'Ada');
    expect(control.value).toBe('Ada');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('alert')).toBeNull();

    control.disable();
    await new Promise((resolve) => setTimeout(resolve));
    expect(input).toBeDisabled();
  });
});
