import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { RadioGroupComponent, RadioGroupOption } from './radio-group';

const sizes: RadioGroupOption[] = [
  { label: 'Small', value: 's' },
  { label: 'Medium', value: 'm', disabled: true },
  { label: 'Large', value: 'l' },
];

describe('RadioGroupComponent', () => {
  it('is a labelled radio group with one tab stop and roving arrow keys', async () => {
    const { fixture, container } = await render(
      `<ds-radio-group label="Size" [options]="sizes" [(value)]="size" />
       <button type="button">After</button>`,
      { imports: [RadioGroupComponent], componentProperties: { sizes, size: 's' } },
    );
    expect(screen.getByRole('radiogroup', { name: 'Size' })).toBeInTheDocument();
    const small = screen.getByRole('radio', { name: 'Small' });
    expect(small).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeDisabled();
    await userEvent.tab();
    expect(small).toHaveFocus();
    // Arrows skip the disabled option, select as they move, and wrap.
    await userEvent.keyboard('{ArrowDown}');
    const large = screen.getByRole('radio', { name: 'Large' });
    expect(large).toHaveFocus();
    expect(large).toBeChecked();
    expect((fixture.componentInstance as unknown as { size: string }).size).toBe('l');
    await userEvent.keyboard('{ArrowRight}');
    expect(small).toBeChecked();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await expectNoA11yViolations(container);
  });

  it('takes aria-label when there is no visible label, and disables every option', async () => {
    await render(`<ds-radio-group aria-label="Size" [options]="sizes" disabled />`, {
      imports: [RadioGroupComponent],
      componentProperties: { sizes },
    });
    const group = screen.getByRole('radiogroup', { name: 'Size' });
    expect(group.closest('ds-radio-group')).not.toHaveAttribute('aria-label');
    screen.getAllByRole('radio').forEach((radio) => expect(radio).toBeDisabled());
  });

  it('works with reactive forms: required, touched, disabled', async () => {
    const control = new FormControl<string | null>(null, Validators.required);
    const { fixture } = await render(
      `<ds-radio-group label="Size" [options]="sizes" [formControl]="control" />`,
      {
        imports: [RadioGroupComponent, ReactiveFormsModule],
        componentProperties: { sizes, control },
      },
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
    await userEvent.click(screen.getByRole('radio', { name: 'Large' }));
    await userEvent.tab();
    expect(control.value).toBe('l');
    expect(control.touched).toBe(true);
    control.setValue('s');
    await fixture.whenStable();
    expect(screen.getByRole('radio', { name: 'Small' })).toBeChecked();
    control.disable();
    await fixture.whenStable();
    expect(screen.getByRole('radio', { name: 'Large' })).toBeDisabled();
  });

  it('works with ngModel', async () => {
    const { fixture } = await render(
      `<ds-radio-group label="Size" [options]="sizes" [(ngModel)]="size" />`,
      { imports: [RadioGroupComponent, FormsModule], componentProperties: { sizes, size: 'l' } },
    );
    await fixture.whenStable();
    expect(screen.getByRole('radio', { name: 'Large' })).toBeChecked();
    await userEvent.click(screen.getByText('Small'));
    expect((fixture.componentInstance as unknown as { size: string }).size).toBe('s');
  });
});
