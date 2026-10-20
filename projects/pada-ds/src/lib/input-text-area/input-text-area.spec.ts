import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { InputTextAreaComponent } from './input-text-area';

describe('InputTextAreaComponent', () => {
  it('labels and describes the textarea', async () => {
    const { container } = await render(
      `<ds-input-text-area label="Notes" description="Visible to your team." placeholder="Add a note" rows="4" required />`,
      { imports: [InputTextAreaComponent] },
    );
    const textarea = screen.getByRole('textbox', { name: /Notes/ });
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toBeRequired();
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).toHaveAttribute('placeholder', 'Add a note');
    expect(textarea).toHaveAccessibleDescription('Visible to your team.');
    await expectNoA11yViolations(container);
  });

  it('shows the error instead of the description and marks the textarea invalid', async () => {
    await render(
      `<ds-input-text-area label="Notes" description="Optional" error="Too short." optional />`,
      { imports: [InputTextAreaComponent] },
    );
    const textarea = screen.getByRole('textbox', { name: /Notes/ });
    expect(screen.getByText('(optional)')).toBeInTheDocument();
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Too short.');
    expect(textarea).toHaveAccessibleDescription('Too short.');
  });

  it('two-way binds value without forms', async () => {
    const { fixture } = await render(`<ds-input-text-area label="Bio" [(value)]="bio" />`, {
      imports: [InputTextAreaComponent],
      componentProperties: { bio: 'Hi' },
    });
    const textarea = screen.getByLabelText('Bio');
    expect(textarea).toHaveValue('Hi');
    await userEvent.type(textarea, '{Enter}there');
    expect((fixture.componentInstance as unknown as { bio: string }).bio).toBe('Hi\nthere');
  });

  it('works as a reactive forms control, showing the error once touched', async () => {
    const control = new FormControl('', [Validators.required, Validators.minLength(5)]);
    const { fixture } = await render(
      `<ds-input-text-area label="Reason" error="Write at least 5 characters." [formControl]="control" />`,
      { imports: [InputTextAreaComponent, ReactiveFormsModule], componentProperties: { control } },
    );
    const textarea = screen.getByLabelText(/Reason/);
    expect(textarea).toBeRequired();
    expect(screen.queryByRole('alert')).toBeNull();
    await userEvent.type(textarea, 'abc');
    await userEvent.tab();
    expect(control.value).toBe('abc');
    expect(screen.getByRole('alert')).toHaveTextContent('Write at least 5 characters.');
    await userEvent.type(textarea, 'def');
    expect(screen.queryByRole('alert')).toBeNull();
    control.setValue('reset');
    await settle(fixture);
    expect(textarea).toHaveValue('reset');
    control.disable();
    await settle(fixture);
    expect(textarea).toBeDisabled();
  });

  it('works with ngModel', async () => {
    const { fixture } = await render(`<ds-input-text-area label="Bio" [(ngModel)]="bio" />`, {
      imports: [InputTextAreaComponent, FormsModule],
      componentProperties: { bio: 'Hello' },
    });
    await fixture.whenStable();
    const textarea = screen.getByLabelText('Bio');
    expect(textarea).toHaveValue('Hello');
    await userEvent.type(textarea, '!');
    expect((fixture.componentInstance as unknown as { bio: string }).bio).toBe('Hello!');
  });
});
