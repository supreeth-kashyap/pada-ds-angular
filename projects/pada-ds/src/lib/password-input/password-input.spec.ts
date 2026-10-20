import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { PasswordInputComponent } from './password-input';
import { estimatePasswordStrength } from './password-strength';

describe('PasswordInputComponent', () => {
  it('toggles visibility with a pressed button', async () => {
    const { container } = await render(`<ds-password-input label="Password" />`, {
      imports: [PasswordInputComponent],
    });
    const input = screen.getByLabelText(/^Password/);
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('autocomplete', 'current-password');
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-controls', input.id);
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(input).toHaveAttribute('type', 'text');
    await expectNoA11yViolations(container);
  });

  it('meters the strength as you type', async () => {
    const { container } = await render(
      `<ds-password-input label="New password" autocomplete="new-password" strength />`,
      { imports: [PasswordInputComponent] },
    );
    const meter = screen.getByRole('meter', { name: 'Password strength' });
    expect(meter).toHaveAttribute('aria-valuenow', '0');
    await userEvent.type(screen.getByLabelText(/^New password/), 'correct-Horse-7');
    expect(meter).toHaveAttribute('aria-valuetext', 'Strong');
    expect(container.querySelectorAll('.password-strength-bar[data-filled]')).toHaveLength(4);
    await expectNoA11yViolations(container);
  });

  it('takes a score of your own', async () => {
    await render(`<ds-password-input label="Password" [strength]="2" />`, {
      imports: [PasswordInputComponent],
    });
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', 'Fair');
  });

  it('works with reactive forms and ngModel', async () => {
    const control = new FormControl('', [Validators.required, Validators.minLength(8)]);
    const { fixture } = await render(
      `<ds-password-input label="Password" error="At least 8 characters." [formControl]="control" />
       <ds-password-input label="Confirm" [(ngModel)]="confirm" />`,
      {
        imports: [PasswordInputComponent, ReactiveFormsModule, FormsModule],
        componentProperties: { control, confirm: '' },
      },
    );
    const input = screen.getByLabelText(/^Password/);
    expect(input).toBeRequired();
    await userEvent.type(input, 'short');
    await userEvent.tab();
    expect(control.value).toBe('short');
    expect(screen.getByRole('alert')).toHaveTextContent('At least 8 characters.');
    control.disable();
    await fixture.whenStable();
    expect(input).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Confirm'), 'secret');
    expect((fixture.componentInstance as unknown as { confirm: string }).confirm).toBe('secret');
  });

  it('estimates strength', () => {
    expect(estimatePasswordStrength('')).toBe(0);
    expect(estimatePasswordStrength('abc')).toBe(0);
    expect(estimatePasswordStrength('abcdefgh')).toBe(1);
    expect(estimatePasswordStrength('abcdefgh1')).toBe(2);
    expect(estimatePasswordStrength('Abcdefgh12!x')).toBe(4);
  });
});
