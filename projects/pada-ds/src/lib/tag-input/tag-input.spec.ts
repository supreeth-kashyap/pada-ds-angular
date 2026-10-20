import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { TagInputComponent } from './tag-input';

const tags = () =>
  within(screen.getByRole('list'))
    .getAllByRole('listitem')
    .map((item) => item.textContent?.trim());

describe('TagInputComponent', () => {
  it('adds tags with Enter and commas, and announces them', async () => {
    const { fixture } = await render(
      `<form data-testid="form"><ds-tag-input label="Keywords" name="keywords" [(value)]="keywords" /></form>`,
      { imports: [TagInputComponent], componentProperties: { keywords: [] as string[] } },
    );
    const input = screen.getByRole('textbox', { name: /Keywords/ });
    await userEvent.type(input, 'tokens{Enter}motion,');
    await settle(fixture);
    expect(tags()).toEqual(['tokens', 'motion']);
    expect((fixture.componentInstance as unknown as { keywords: string[] }).keywords).toEqual([
      'tokens',
      'motion',
    ]);
    expect(input).toHaveValue('');
    expect(document.body).toHaveTextContent('Added motion. 2 tags.');
    expect(screen.getByRole('list', { name: 'Keywords: 2 tags' })).toBeInTheDocument();
    expect(new FormData(screen.getByTestId('form') as HTMLFormElement).getAll('keywords')).toEqual([
      'tokens',
      'motion',
    ]);
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('pastes lists, rejects duplicates and invalid tags with a message', async () => {
    const validate = (tag: string) => (tag.includes('@') ? null : `${tag} is not an email.`);
    const { fixture } = await render(
      `<ds-tag-input label="Emails" [value]="['ada@example.com']" [validate]="validate" />`,
      { imports: [TagInputComponent], componentProperties: { validate } },
    );
    const input = screen.getByRole('textbox', { name: /Emails/ });
    await userEvent.click(input);
    await userEvent.paste('grace@example.com, ADA@example.com\nalan');
    await settle(fixture);
    expect(tags()).toEqual(['ada@example.com', 'grace@example.com']);
    expect(screen.getByRole('alert')).toHaveTextContent('"ADA@example.com" is already added.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveValue('ADA@example.com, alan');
    await userEvent.type(input, 'x');
    await settle(fixture);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Backspace moves to the last tag and removes it; arrows move between tags', async () => {
    const { fixture } = await render(`<ds-tag-input label="Labels" [value]="['a', 'b', 'c']" />`, {
      imports: [TagInputComponent],
    });
    const input = screen.getByRole('textbox', { name: /Labels/ });
    await userEvent.click(input);
    await userEvent.keyboard('{Backspace}');
    expect(screen.getByRole('button', { name: 'Remove c' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Remove b' })).toHaveFocus();
    await userEvent.keyboard('{Delete}');
    await settle(fixture);
    expect(tags()).toEqual(['a', 'c']);
    expect(screen.getByRole('button', { name: 'Remove c' })).toHaveFocus();
    expect(document.body).toHaveTextContent('Removed b. 2 tags.');
    await userEvent.keyboard('{ArrowRight}');
    expect(input).toHaveFocus();
  });

  it('stops at maxTags and adds left-over text on blur', async () => {
    const { fixture } = await render(
      `<ds-tag-input label="Top 2" [maxTags]="2" [value]="['x']" />`,
      { imports: [TagInputComponent] },
    );
    const input = screen.getByRole('textbox', { name: /Top 2/ });
    await userEvent.type(input, 'y');
    await userEvent.tab();
    await settle(fixture);
    expect(tags()).toEqual(['x', 'y']);
    expect(input).toHaveAttribute('readonly');
  });

  it('works as a reactive forms control and with ngModel', async () => {
    const control = new FormControl<string[]>(['one']);
    const { fixture } = await render(
      `<ds-tag-input label="Reactive" [formControl]="control" />
       <ds-tag-input label="Model" [(ngModel)]="model" />`,
      {
        imports: [TagInputComponent, ReactiveFormsModule, FormsModule],
        componentProperties: { control, model: ['m'] },
      },
    );
    await settle(fixture);
    const reactive = screen.getByRole('textbox', { name: /Reactive/ });
    await userEvent.type(reactive, 'two{Enter}');
    expect(control.value).toEqual(['one', 'two']);
    await userEvent.tab();
    expect(control.touched).toBe(true);
    control.setValue(['reset']);
    await settle(fixture);
    expect(screen.getByRole('list', { name: 'Reactive: 1 tag' })).toHaveTextContent('reset');
    control.disable();
    await settle(fixture);
    expect(reactive).toBeDisabled();

    expect(screen.getByRole('list', { name: 'Model: 1 tag' })).toHaveTextContent('m');
    await userEvent.type(screen.getByRole('textbox', { name: /Model/ }), 'n{Enter}');
    expect((fixture.componentInstance as unknown as { model: string[] }).model).toEqual(['m', 'n']);
  });
});
