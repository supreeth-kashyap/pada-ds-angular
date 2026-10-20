import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { FieldParts } from '../field/field';
import { CheckboxGroupComponent, CheckboxGroupOption } from './checkbox-group';

const options: CheckboxGroupOption[] = [
  { value: 'mentions', label: 'Mentions' },
  { value: 'comments', label: 'Comments' },
  { value: 'releases', label: 'Releases' },
];

describe('CheckboxGroupComponent', () => {
  it('is a labelled, described group whose value is the checked options in order', async () => {
    const { fixture } = await render(
      `<ds-checkbox-group label="Notify me about" description="At most one email a day."
        [options]="options" [(value)]="value" />`,
      { imports: [CheckboxGroupComponent], componentProperties: { options, value: ['releases'] } },
    );
    const group = screen.getByRole('group', { name: 'Notify me about' });
    expect(group).toHaveAccessibleDescription('At most one email a day.');
    expect(group).toHaveAttribute('data-orientation', 'vertical');
    expect(screen.getByRole('checkbox', { name: 'Releases' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Mentions' })).not.toBeChecked();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Mentions' }));
    const host = fixture.componentInstance as unknown as { value: string[] };
    expect(host.value).toEqual(['mentions', 'releases']);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Releases' }));
    expect(host.value).toEqual(['mentions']);
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('toggles with Space and moves with Tab', async () => {
    await render(`<ds-checkbox-group label="Topics" [options]="options" />`, {
      imports: [CheckboxGroupComponent],
      componentProperties: { options },
    });
    await userEvent.tab();
    expect(screen.getByRole('checkbox', { name: 'Mentions' })).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('checkbox', { name: 'Mentions' })).toBeChecked();
    await userEvent.tab();
    expect(screen.getByRole('checkbox', { name: 'Comments' })).toHaveFocus();
  });

  it('has a select-all box that is mixed for some and only changes enabled choices', async () => {
    const withDisabled = [...options, { value: 'billing', label: 'Billing', disabled: true }];
    const { fixture } = await render(
      `<ds-checkbox-group label="Topics" [options]="options" [(value)]="value" selectAll />`,
      {
        imports: [CheckboxGroupComponent],
        componentProperties: { options: withDisabled, value: ['comments', 'billing'] },
      },
    );
    const all = screen.getByRole('checkbox', { name: 'Select all' });
    expect(all).toHaveAttribute('aria-checked', 'mixed');
    expect(screen.getByRole('checkbox', { name: 'Billing' })).toBeDisabled();

    await userEvent.click(all);
    await settle(fixture);
    const host = fixture.componentInstance as unknown as { value: string[] };
    expect(host.value).toEqual(['mentions', 'comments', 'releases', 'billing']);
    expect(all).toBeChecked();
    expect(all).not.toHaveAttribute('aria-checked');

    await userEvent.click(all);
    await settle(fixture);
    expect(host.value).toEqual(['billing']);
    expect(all).not.toBeChecked();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('works with reactive forms: required, error once touched, and disabled', async () => {
    const control = new FormControl<string[]>([], Validators.required);
    const { fixture } = await render(
      `<ds-checkbox-group label="Topics" error="Pick at least one." [options]="options"
        [formControl]="control" name="topics" />`,
      {
        imports: [CheckboxGroupComponent, ReactiveFormsModule],
        componentProperties: { options, control },
      },
    );
    const group = screen.getByRole('group', { name: /Topics/ });
    expect(group).not.toHaveAttribute('data-invalid');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Comments' }));
    expect(control.value).toEqual(['comments']);
    expect(screen.getByRole('checkbox', { name: 'Comments' })).toHaveAttribute('name', 'topics');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Comments' }));
    await settle(fixture);
    expect(control.value).toEqual([]);
    expect(group).toHaveAttribute('data-invalid');
    expect(group).toHaveAccessibleDescription('Pick at least one.');

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(control.touched).toBe(true);

    control.setValue(['releases']);
    control.disable();
    await settle(fixture);
    expect(screen.getByRole('checkbox', { name: 'Releases' })).toBeChecked();
    for (const box of screen.getAllByRole('checkbox')) expect(box).toBeDisabled();
    expect(group).toHaveAttribute('data-disabled');
  });

  it('works with ngModel and lays out in a row', async () => {
    const { fixture } = await render(
      `<ds-checkbox-group aria-label="Topics" orientation="horizontal" [options]="options"
        [(ngModel)]="topics" />`,
      { imports: [CheckboxGroupComponent, FormsModule], componentProperties: { options, topics: ['mentions'] } },
    );
    await settle(fixture);
    const group = screen.getByRole('group', { name: 'Topics' });
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.getByRole('checkbox', { name: 'Mentions' })).toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Releases' }));
    const host = fixture.componentInstance as unknown as { topics: string[] };
    expect(host.topics).toEqual(['mentions', 'releases']);
  });

  it('keeps unique ids for its choices inside a ds-field', async () => {
    const { container } = await render(
      `<ds-field><ds-checkbox-group label="Topics" [options]="options" /></ds-field>`,
      { imports: [CheckboxGroupComponent, ...FieldParts], componentProperties: { options } },
    );
    const ids = screen.getAllByRole('checkbox').map((box) => box.id);
    expect(new Set(ids).size).toBe(3);
    await expectNoA11yViolations(container);
  });
});
