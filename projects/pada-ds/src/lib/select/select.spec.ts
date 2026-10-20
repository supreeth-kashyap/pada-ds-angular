import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DialogParts } from '../dialog/dialog';
import { SelectComponent, SelectOption } from './select';

const fruit: SelectOption[] = [
  { label: 'Banana', value: 'banana' },
  { label: 'Blackberry', value: 'blackberry' },
  { label: 'Blueberry', value: 'blueberry', disabled: true },
  { label: 'Cherry', value: 'cherry' },
];

const plans: SelectOption[] = [
  { label: 'Free', value: 'free' },
  { label: 'Pro', value: 'pro' },
];

const active = (trigger: HTMLElement, name: string) =>
  expect(trigger).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name }).id);

describe('SelectComponent', () => {
  it('submits its value with forms through a hidden input', async () => {
    const { fixture } = await render(
      `<form data-testid="form"><ds-select label="Plan" name="plan" [options]="plans" value="pro" /></form>`,
      { imports: [SelectComponent], componentProperties: { plans } },
    );
    await settle(fixture);
    const data = new FormData(screen.getByTestId('form') as HTMLFormElement);
    expect(data.get('plan')).toBe('pro');
    expect(screen.getByRole('combobox', { name: 'Plan' })).toHaveTextContent('Pro');
  });

  it('describes the trigger with its description and error', async () => {
    await render(
      `<ds-select label="Plan" [options]="plans" description="Billed monthly." error="Choose a plan" />`,
      { imports: [SelectComponent], componentProperties: { plans } },
    );
    const trigger = screen.getByRole('combobox', { name: 'Plan' });
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAccessibleDescription('Billed monthly. Choose a plan');
    expect(trigger).toHaveTextContent('Select an option');
  });

  it('opens a floating listbox and moves through it from the trigger, with multi-letter type-ahead', async () => {
    const picked: SelectOption[] = [];
    const { fixture } = await render(
      `<ds-select label="Fruit" [options]="fruit" [(value)]="choice" (selectionChange)="picked.push($event)" />`,
      { imports: [SelectComponent], componentProperties: { fruit, picked, choice: null } },
    );
    const trigger = screen.getByRole('combobox', { name: 'Fruit' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    const listbox = screen.getByRole('listbox', { name: 'Fruit' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', listbox.id);
    expect(listbox.closest('[data-pada-layer]')).toHaveAttribute('data-side', 'bottom');
    active(trigger, 'Banana');
    expect(trigger).toHaveFocus();
    // "bl" lands on Blackberry, not the next B option.
    await userEvent.keyboard('bl');
    await settle(fixture);
    active(trigger, 'Blackberry');
    await expectNoA11yViolations(fixture.nativeElement);
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(picked).toEqual([fruit[1]]);
    expect((fixture.componentInstance as unknown as { choice: string }).choice).toBe('blackberry');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(trigger).toHaveTextContent('Blackberry');
    expect(trigger).toHaveFocus();
  });

  it('skips disabled options, stops at the ends, and Home/End open and jump', async () => {
    const { fixture } = await render(`<ds-select label="Fruit" [options]="fruit" />`, {
      imports: [SelectComponent],
      componentProperties: { fruit },
    });
    const trigger = screen.getByRole('combobox', { name: 'Fruit' });
    trigger.focus();
    await userEvent.keyboard('{End}');
    await settle(fixture);
    active(trigger, 'Cherry');
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    active(trigger, 'Cherry');
    await userEvent.keyboard('{ArrowUp}');
    await settle(fixture);
    active(trigger, 'Blackberry');
    expect(screen.getByRole('option', { name: 'Blueberry' })).toBeDisabled();
    await userEvent.keyboard('{Home}');
    await settle(fixture);
    active(trigger, 'Banana');
    await userEvent.keyboard(' ');
    await settle(fixture);
    expect(trigger).toHaveTextContent('Banana');

    // Reopening starts on the selected option; Tab closes.
    await userEvent.keyboard('{ArrowUp}');
    await settle(fixture);
    active(trigger, 'Banana');
    expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.tab();
    await settle(fixture);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('groups options under headings', async () => {
    const grouped: SelectOption[] = [
      { label: 'Apple', value: 'apple', group: 'Fruit' },
      { label: 'Kale', value: 'kale', group: 'Vegetables' },
    ];
    const { fixture } = await render(`<ds-select label="Food" [options]="grouped" />`, {
      imports: [SelectComponent],
      componentProperties: { grouped },
    });
    await userEvent.click(screen.getByRole('combobox', { name: 'Food' }));
    await settle(fixture);
    expect(screen.getByRole('group', { name: 'Vegetables' })).toContainElement(
      screen.getByRole('option', { name: 'Kale' }),
    );
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('inside a dialog: picking an option or pressing Escape closes only the list', async () => {
    const { fixture } = await render(
      `<ds-dialog [open]="true">
         <ds-dialog-content>
           <ds-dialog-title>Preferences</ds-dialog-title>
           <ds-select label="Fruit" [options]="fruit" />
         </ds-dialog-content>
       </ds-dialog>`,
      { imports: [SelectComponent, ...DialogParts], componentProperties: { fruit } },
    );
    await settle(fixture);
    const trigger = screen.getByRole('combobox', { name: 'Fruit' });
    await userEvent.click(trigger);
    await settle(fixture);
    await userEvent.click(screen.getByRole('option', { name: 'Cherry' }));
    await settle(fixture);
    expect(screen.getByRole('dialog', { name: 'Preferences' })).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(trigger).toHaveTextContent('Cherry');

    await userEvent.click(trigger);
    await settle(fixture);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Preferences' })).toBeInTheDocument();
  });

  it('closes on an outside click and toggles from the trigger', async () => {
    const { fixture } = await render(
      `<button>Outside</button><ds-select label="Fruit" [options]="fruit" />`,
      { imports: [SelectComponent], componentProperties: { fruit } },
    );
    const trigger = screen.getByRole('combobox', { name: 'Fruit' });
    await userEvent.click(trigger);
    await settle(fixture);
    await userEvent.click(trigger);
    await settle(fixture);
    expect(screen.queryByRole('listbox')).toBeNull();
    await userEvent.click(trigger);
    await settle(fixture);
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));
    await settle(fixture);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('works as a reactive forms control', async () => {
    const plan = new FormControl<string | null>(null, Validators.required);
    const { fixture } = await render(
      `<ds-select label="Plan" [options]="plans" error="Choose a plan." [formControl]="plan" />`,
      { imports: [SelectComponent, ReactiveFormsModule], componentProperties: { plans, plan } },
    );
    await settle(fixture);
    const trigger = screen.getByRole('combobox', { name: 'Plan' });
    expect(trigger).not.toHaveAttribute('aria-invalid');
    await userEvent.click(trigger);
    await settle(fixture);
    await userEvent.tab();
    await settle(fixture);
    expect(plan.touched).toBe(true);
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAccessibleDescription('Choose a plan.');

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await settle(fixture);
    expect(plan.value).toBe('pro');
    expect(trigger).not.toHaveAttribute('aria-invalid');

    plan.setValue('free');
    await settle(fixture);
    expect(trigger).toHaveTextContent('Free');
    plan.disable();
    await settle(fixture);
    expect(trigger).toBeDisabled();
  });

  it('works with ngModel', async () => {
    const { fixture } = await render(
      `<ds-select label="Plan" [options]="plans" [(ngModel)]="plan" />`,
      { imports: [SelectComponent, FormsModule], componentProperties: { plans, plan: 'pro' } },
    );
    await settle(fixture);
    const trigger = screen.getByRole('combobox', { name: 'Plan' });
    expect(trigger).toHaveTextContent('Pro');
    await userEvent.click(trigger);
    await settle(fixture);
    await userEvent.click(screen.getByRole('option', { name: 'Free' }));
    await settle(fixture);
    expect((fixture.componentInstance as unknown as { plan: string }).plan).toBe('free');
  });
});
