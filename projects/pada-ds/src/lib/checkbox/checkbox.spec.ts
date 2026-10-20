import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { FieldParts } from '../field/field';
import { CheckboxComponent } from './checkbox';

describe('CheckboxComponent', () => {
  it('keeps the label wired to a consumer id, or to projected content', async () => {
    const { container } = await render(
      `<ds-checkbox inputId="terms" label="Accept terms" />
       <ds-checkbox>Send me news</ds-checkbox>
       <ds-checkbox aria-label="Select row" />`,
      { imports: [CheckboxComponent] },
    );
    expect(screen.getByRole('checkbox', { name: 'Accept terms' })).toHaveAttribute('id', 'terms');
    expect(screen.getByRole('checkbox', { name: 'Send me news' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select row' })).toBeInTheDocument();
    expect(container.querySelector('ds-checkbox[aria-label]')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('supports the indeterminate (mixed) state, cleared by a click', async () => {
    const { fixture, container } = await render(
      `<ds-checkbox label="Select all" [(checked)]="all" [(indeterminate)]="some" />`,
      { imports: [CheckboxComponent], componentProperties: { all: false, some: true } },
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    await expectNoA11yViolations(container);
    await userEvent.click(checkbox);
    const host = fixture.componentInstance as unknown as { all: boolean; some: boolean };
    expect(checkbox.indeterminate).toBe(false);
    expect(checkbox).not.toHaveAttribute('aria-checked');
    expect(checkbox).toBeChecked();
    expect(host).toEqual(expect.objectContaining({ all: true, some: false }));
  });

  it('works with reactive forms: required, touched and disabled', async () => {
    const control = new FormControl(false, Validators.requiredTrue);
    const { fixture } = await render(`<ds-checkbox label="Accept" [formControl]="control" />`, {
      imports: [CheckboxComponent, ReactiveFormsModule],
      componentProperties: { control },
    });
    const checkbox = screen.getByRole('checkbox', { name: 'Accept' });
    await userEvent.click(checkbox);
    await userEvent.tab();
    expect(control.value).toBe(true);
    expect(control.touched).toBe(true);
    control.setValue(false);
    await fixture.whenStable();
    expect(checkbox).not.toBeChecked();
    control.disable();
    await fixture.whenStable();
    expect(checkbox).toBeDisabled();
    expect(fixture.nativeElement.querySelector('ds-checkbox')).toHaveAttribute('data-disabled');
  });

  it('works with ngModel', async () => {
    const { fixture } = await render(`<ds-checkbox label="Remember me" [(ngModel)]="remember" />`, {
      imports: [CheckboxComponent, FormsModule],
      componentProperties: { remember: true },
    });
    await fixture.whenStable();
    const checkbox = screen.getByRole('checkbox', { name: 'Remember me' });
    expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    expect((fixture.componentInstance as unknown as { remember: boolean }).remember).toBe(false);
  });

  it('inside a ds-field, takes the field id, description, error and required state', async () => {
    // requiredTrue: false is a value, so plain `required` would accept an unchecked box.
    const control = new FormControl(false, Validators.requiredTrue);
    const { container } = await render(
      `<ds-field required>
         <ds-field-label>Terms</ds-field-label>
         <ds-checkbox label="I accept the terms" [formControl]="control" />
         <ds-field-description>Read them first.</ds-field-description>
         <ds-field-error>You must accept.</ds-field-error>
       </ds-field>`,
      {
        imports: [CheckboxComponent, ...FieldParts, ReactiveFormsModule],
        componentProperties: { control },
      },
    );
    const checkbox = screen.getByRole('checkbox', { name: /I accept the terms/ });
    expect(checkbox).toBeRequired();
    expect(checkbox).toHaveAccessibleDescription('Read them first.');
    await userEvent.click(checkbox);
    await userEvent.click(checkbox);
    await userEvent.tab();
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('You must accept.');
    await expectNoA11yViolations(container);
  });
});
