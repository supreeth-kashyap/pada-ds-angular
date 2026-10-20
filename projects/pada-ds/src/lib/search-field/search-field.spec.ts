import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { SearchFieldComponent } from './search-field';

describe('SearchFieldComponent', () => {
  it('is a labelled input that shows a clear button once it has text', async () => {
    let cleared = 0;
    const { fixture } = await render(
      `<ds-search-field [(value)]="query" (cleared)="onClear()" />`,
      {
        imports: [SearchFieldComponent],
        componentProperties: { query: '', onClear: () => (cleared += 1) },
      },
    );
    const input = screen.getByRole('textbox', { name: 'Search' });
    expect(input).toHaveAttribute('placeholder', 'Search');
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    await userEvent.type(input, 'tokens');
    await settle(fixture);
    expect((fixture.componentInstance as unknown as { query: string }).query).toBe('tokens');
    await expectNoA11yViolations(fixture.nativeElement);

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    await settle(fixture);
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(cleared).toBe(1);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  it('Escape clears the text', async () => {
    const { fixture } = await render(`<ds-search-field aria-label="Find people" value="ada" />`, {
      imports: [SearchFieldComponent],
    });
    const input = screen.getByRole('textbox', { name: 'Find people' });
    await userEvent.click(input);
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(input).toHaveValue('');
  });

  it('hides the clear button while disabled', async () => {
    await render(`<ds-search-field value="ada" disabled />`, { imports: [SearchFieldComponent] });
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('works with reactive forms and ngModel', async () => {
    const control = new FormControl('first');
    const { fixture } = await render(
      `<ds-search-field aria-label="Reactive" [formControl]="control" />
       <ds-search-field aria-label="Model" [(ngModel)]="model" />`,
      {
        imports: [SearchFieldComponent, ReactiveFormsModule, FormsModule],
        componentProperties: { control, model: 'm' },
      },
    );
    await settle(fixture);
    const reactive = screen.getByRole('textbox', { name: 'Reactive' });
    expect(reactive).toHaveValue('first');
    await userEvent.type(reactive, '!');
    expect(control.value).toBe('first!');
    await userEvent.keyboard('{Escape}');
    expect(control.value).toBe('');
    control.disable();
    await settle(fixture);
    expect(reactive).toBeDisabled();

    const model = screen.getByRole('textbox', { name: 'Model' });
    expect(model).toHaveValue('m');
    await userEvent.type(model, 'n');
    expect((fixture.componentInstance as unknown as { model: string }).model).toBe('mn');
  });
});
