import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { RadioCardGroupComponent, RadioCardOption } from './radio-card';

const plans: RadioCardOption[] = [
  { value: 'free', title: 'Free', description: 'For trying things out', meta: '$0', icon: 'add' },
  { value: 'pro', title: 'Pro', description: 'For small teams', meta: '$12' },
  { value: 'enterprise', title: 'Enterprise', description: 'Talk to us', disabled: true },
];

describe('RadioCardGroupComponent', () => {
  it('is a named group of described radios; arrow keys select', async () => {
    const onValueChange = vi.fn();
    const { container } = await render(
      `<ds-radio-card-group label="Plan" description="Billed monthly." [options]="plans" value="free"
         [columns]="2" (valueChange)="onValueChange($event)" />`,
      { imports: [RadioCardGroupComponent], componentProperties: { plans, onValueChange } },
    );
    const group = screen.getByRole('group', { name: 'Plan' });
    expect(group).toHaveAccessibleDescription('Billed monthly.');
    expect(group.style.getPropertyValue('--pada-radio-card-columns')).toBe('2');
    const free = screen.getByRole('radio', { name: /Free/ });
    expect(free).toBeChecked();
    expect(free).toHaveAccessibleDescription('For trying things out');
    free.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith('pro');
    expect(screen.getByRole('radio', { name: /Pro/ }).closest('label')).toHaveAttribute(
      'data-checked',
    );
    expect(screen.getByRole('radio', { name: /Enterprise/ })).toBeDisabled();
    await expectNoA11yViolations(container);
  });

  it('works with reactive forms and ngModel', async () => {
    const control = new FormControl<string | null>(null, Validators.required);
    const { fixture } = await render(
      `<ds-radio-card-group label="A" [options]="plans" [formControl]="control" />
       <ds-radio-card-group label="B" [options]="plans" [(ngModel)]="b" />`,
      {
        imports: [RadioCardGroupComponent, ReactiveFormsModule, FormsModule],
        componentProperties: { plans, control, b: 'pro' },
      },
    );
    await fixture.whenStable();
    const [a, b] = screen.getAllByRole('group');
    const radios = (group: HTMLElement) => Array.from(group.querySelectorAll('input'));
    expect(radios(a)[0]).toBeRequired();
    await userEvent.click(radios(a)[1].closest('label')!);
    await userEvent.tab();
    expect(control.value).toBe('pro');
    expect(control.touched).toBe(true);
    control.disable();
    await fixture.whenStable();
    expect(radios(a)[0]).toBeDisabled();
    expect(radios(b)[1]).toBeChecked();
    await userEvent.click(radios(b)[0].closest('label')!);
    expect((fixture.componentInstance as unknown as { b: string }).b).toBe('free');
  });
});
