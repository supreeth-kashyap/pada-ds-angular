import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { AutocompleteComponent, AutocompleteOption } from './autocomplete';

const people: AutocompleteOption[] = [
  { value: 'ada', label: 'Ada Lovelace', description: 'Engineering' },
  { value: 'grace', label: 'Grace Hopper', description: 'Platform' },
  { value: 'alan', label: 'Alan Turing', description: 'Research', disabled: true },
];

describe('AutocompleteComponent', () => {
  it('single: filters, picks with Enter, fills the input and submits with forms', async () => {
    const { fixture } = await render(
      `<form data-testid="form">
         <ds-autocomplete label="Assignee" [options]="people" name="assignee" [(value)]="assignee"
           description="Who owns this task." />
       </form>`,
      { imports: [AutocompleteComponent], componentProperties: { people, assignee: null } },
    );
    await settle(fixture);
    const input = screen.getByRole('combobox', { name: 'Assignee' });
    expect(input).toHaveAccessibleDescription('Who owns this task.');
    await userEvent.type(input, 'gra');
    await settle(fixture);
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option').id);
    await expectNoA11yViolations(fixture.nativeElement);
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect((fixture.componentInstance as unknown as { assignee: string }).assignee).toBe('grace');
    expect(input).toHaveValue('Grace Hopper');
    const form = screen.getByTestId('form') as HTMLFormElement;
    expect(new FormData(form).get('assignee')).toBe('grace');
  });

  it('single: shows the label of an initial value', async () => {
    const { fixture } = await render(
      `<ds-autocomplete label="Assignee" [options]="people" value="ada" />`,
      { imports: [AutocompleteComponent], componentProperties: { people } },
    );
    await settle(fixture);
    expect(screen.getByRole('combobox')).toHaveValue('Ada Lovelace');
  });

  it('multiple: chips, removal buttons and Backspace', async () => {
    const { fixture } = await render(
      `<ds-autocomplete label="Reviewers" [options]="people" multiple [(values)]="reviewers" />`,
      { imports: [AutocompleteComponent], componentProperties: { people, reviewers: ['ada'] } },
    );
    const host = fixture.componentInstance as unknown as { reviewers: string[] };
    await settle(fixture);
    expect(screen.getByRole('button', { name: 'Remove Ada Lovelace' })).toBeInTheDocument();
    const input = screen.getByRole('combobox', { name: 'Reviewers' });
    await userEvent.click(input);
    await settle(fixture);
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    await userEvent.click(screen.getByRole('option', { name: /Grace Hopper/ }));
    await settle(fixture);
    expect(host.reviewers).toEqual(['ada', 'grace']);
    expect(input).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Remove Grace Hopper' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}{Backspace}');
    await settle(fixture);
    expect(host.reviewers).toEqual(['ada']);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Ada Lovelace' }));
    await settle(fixture);
    expect(host.reviewers).toEqual([]);
  });

  it('marks errors and shows the empty message', async () => {
    const { fixture } = await render(
      `<ds-autocomplete label="Assignee" [options]="people" error="Pick someone" emptyMessage="Nobody matches" />`,
      { imports: [AutocompleteComponent], componentProperties: { people } },
    );
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Pick someone');
    await userEvent.type(input, 'zzz');
    await settle(fixture);
    expect(screen.getByText('Nobody matches')).toBeVisible();
  });

  it('works as a reactive forms control, single and multiple', async () => {
    const owner = new FormControl<string | null>(null, Validators.required);
    const tags = new FormControl<string[]>(['grace']);
    const { fixture } = await render(
      `<ds-autocomplete label="Owner" [options]="people" error="Pick an owner." [formControl]="owner" />
       <ds-autocomplete label="Team" [options]="people" multiple [formControl]="tags" />`,
      {
        imports: [AutocompleteComponent, ReactiveFormsModule],
        componentProperties: { people, owner, tags },
      },
    );
    await settle(fixture);
    const input = screen.getByRole('combobox', { name: /Owner/ });
    expect(input).toBeRequired();
    expect(screen.getByRole('button', { name: 'Remove Grace Hopper' })).toBeInTheDocument();
    await userEvent.click(input);
    await userEvent.tab();
    await settle(fixture);
    expect(owner.touched).toBe(true);
    expect(screen.getByRole('alert')).toHaveTextContent('Pick an owner.');

    await userEvent.type(input, 'ada{Enter}');
    await settle(fixture);
    expect(owner.value).toBe('ada');
    expect(screen.queryByRole('alert')).toBeNull();

    owner.setValue('grace');
    await settle(fixture);
    expect(input).toHaveValue('Grace Hopper');
    tags.setValue(['ada', 'grace']);
    await settle(fixture);
    expect(screen.getAllByRole('button', { name: /^Remove/ })).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Ada Lovelace' }));
    expect(tags.value).toEqual(['grace']);

    owner.disable();
    await settle(fixture);
    expect(input).toBeDisabled();
  });

  it('works with ngModel', async () => {
    const { fixture } = await render(
      `<ds-autocomplete label="Owner" [options]="people" [(ngModel)]="owner" />`,
      {
        imports: [AutocompleteComponent, FormsModule],
        componentProperties: { people, owner: 'ada' },
      },
    );
    await settle(fixture);
    const input = screen.getByRole('combobox', { name: 'Owner' });
    expect(input).toHaveValue('Ada Lovelace');
    await userEvent.clear(input);
    await userEvent.type(input, 'grace{Enter}');
    await settle(fixture);
    expect((fixture.componentInstance as unknown as { owner: string }).owner).toBe('grace');
  });
});
