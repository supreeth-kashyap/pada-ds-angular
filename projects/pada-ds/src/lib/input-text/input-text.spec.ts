import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { InputTextComponent } from './input-text';

describe('InputTextComponent', () => {
  it('labels the input and describes it, with prefix and suffix content', async () => {
    const { container } = await render(
      `<ds-input-text label="Price" description="Before tax." placeholder="0.00" required>
         <span dsPrefix>$</span><span dsSuffix>USD</span>
       </ds-input-text>`,
      { imports: [InputTextComponent] },
    );
    const input = screen.getByLabelText(/Price/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('placeholder', '0.00');
    expect(input).toHaveAccessibleDescription('Before tax.');
    expect(container).toHaveTextContent('$');
    expect(container).toHaveTextContent('USD');
    await expectNoA11yViolations(container);
  });

  it('shows the error instead of the description and marks the input invalid', async () => {
    await render(
      `<ds-input-text label="Email" description="Work email" error="Enter a valid email." />`,
      {
        imports: [InputTextComponent],
      },
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email.');
    expect(input).toHaveAccessibleDescription('Enter a valid email.');
  });

  it('two-way binds value without forms', async () => {
    const { fixture } = await render(`<ds-input-text label="Name" [(value)]="name" />`, {
      imports: [InputTextComponent],
      componentProperties: { name: 'Ada' },
    });
    const input = screen.getByLabelText('Name');
    expect(input).toHaveValue('Ada');
    await userEvent.clear(input);
    await userEvent.type(input, 'Grace');
    expect((fixture.componentInstance as unknown as { name: string }).name).toBe('Grace');
  });

  it('works as a reactive forms control, showing the error once touched', async () => {
    const control = new FormControl('', [Validators.required, Validators.email]);
    const { fixture } = await render(
      `<ds-input-text label="Email" error="Enter a valid email." [formControl]="control" />`,
      { imports: [InputTextComponent, ReactiveFormsModule], componentProperties: { control } },
    );
    const input = screen.getByLabelText(/Email/);
    expect(input).toBeRequired();
    expect(screen.queryByRole('alert')).toBeNull();

    await userEvent.type(input, 'ada@');
    await userEvent.tab();
    expect(control.value).toBe('ada@');
    expect(control.touched).toBe(true);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email.');

    await userEvent.type(input, 'example.com');
    expect(screen.queryByRole('alert')).toBeNull();

    control.setValue('reset@example.com');
    await fixture.whenStable();
    expect(input).toHaveValue('reset@example.com');
    control.disable();
    await new Promise((resolve) => setTimeout(resolve));
    expect(input).toBeDisabled();
  });

  it('works with ngModel', async () => {
    const { fixture } = await render(`<ds-input-text label="City" [(ngModel)]="city" />`, {
      imports: [InputTextComponent, FormsModule],
      componentProperties: { city: 'Pune' },
    });
    await fixture.whenStable();
    const input = screen.getByLabelText('City');
    expect(input).toHaveValue('Pune');
    await userEvent.type(input, '!');
    expect((fixture.componentInstance as unknown as { city: string }).city).toBe('Pune!');
  });
});
