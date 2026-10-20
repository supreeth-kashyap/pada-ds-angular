import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DsPresence } from '../utils/presence';
import { DsComboboxParts } from './combobox.directive';

const fruit = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry'];

@Component({
  selector: 'ds-combobox-host',
  imports: [DsComboboxParts, DsPresence],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container
      dsCombobox
      #combobox="dsCombobox"
      [multiple]="multiple()"
      [(value)]="value"
      [(values)]="values"
      [(inputValue)]="text"
    >
      <label for="fruit">Fruit</label>
      <div dsComboboxAnchor>
        <input id="fruit" dsComboboxInput />
        <button dsComboboxTrigger>▾</button>
      </div>
      <div *dsPresence="combobox.isOpen()" dsComboboxContent align="start" aria-label="Fruit">
        @for (name of fruit; track name) {
          <div
            dsComboboxItem
            [value]="name.toLowerCase()"
            [disabled]="name === 'Banana'"
            (picked)="picks.push($event)"
          >
            {{ name }}
          </div>
        }
        <div dsComboboxEmpty>No fruit found</div>
      </div>
    </ng-container>
  `,
})
class Host {
  readonly fruit = fruit;
  readonly multiple = signal(false);
  readonly value = signal<string | null>(null);
  readonly values = signal<string[]>([]);
  readonly text = signal('');
  readonly picks: string[] = [];
}

async function setup(multiple = false) {
  const result = await render(Host);
  result.fixture.componentInstance.multiple.set(multiple);
  await settle(result.fixture);
  const input = screen.getByRole('combobox', { name: 'Fruit' });
  return { ...result, input, host: result.fixture.componentInstance };
}

describe('DsCombobox', () => {
  it('filters as you type and highlights the first match', async () => {
    const { fixture, input } = await setup();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    await userEvent.type(input, 'ap');
    await settle(fixture);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox', { name: 'Fruit' });
    expect(input).toHaveAttribute('aria-controls', listbox.id);
    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.textContent?.trim())).toEqual(['Apple', 'Apricot']);
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
    expect(options[0]).toHaveAttribute('data-highlighted');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('highlights the first match even when typing hides nothing', async () => {
    const { fixture, input } = await setup();
    await userEvent.click(input);
    await settle(fixture);
    expect(input).not.toHaveAttribute('aria-activedescendant');
    // The filter trims the text, so a space keeps every item visible.
    await userEvent.type(input, ' ');
    await settle(fixture);
    const visible = screen.getAllByRole('option');
    expect(input).toHaveAttribute('aria-activedescendant', visible[0].id);
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    expect(input).toHaveAttribute('aria-activedescendant', visible[1].id);
  });

  it('moves with arrows (skipping disabled and wrapping), selects with Enter and fills the input', async () => {
    const { fixture, input, host } = await setup();
    await userEvent.click(input);
    await settle(fixture);
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Apple' }).id,
    );
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await settle(fixture);
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Blueberry' }).id,
    );
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await settle(fixture);
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Apple' }).id,
    );
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await settle(fixture);
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Blueberry' }).id,
    );
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(host.value()).toBe('blueberry');
    expect(host.picks).toEqual(['blueberry']);
    expect(input).toHaveValue('Blueberry');
    expect(host.text()).toBe('Blueberry');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('ArrowUp opens on the last item, Alt+ArrowDown only opens, Tab closes', async () => {
    const { fixture, input } = await setup();
    input.focus();
    await userEvent.keyboard('{ArrowUp}');
    await settle(fixture);
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Cherry' }).id,
    );
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await settle(fixture);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Tab}');
    await settle(fixture);
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('shows the empty state, and Escape closes then clears', async () => {
    const { fixture, input } = await setup();
    await userEvent.type(input, 'zz');
    await settle(fixture);
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('No fruit found')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveValue('zz');
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(input).toHaveValue('');
  });

  it('selects with a click without losing focus; multiple keeps the list open', async () => {
    const { fixture, input, host } = await setup(true);
    await userEvent.click(screen.getByRole('button', { name: 'Show suggestions' }));
    await settle(fixture);
    expect(input).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Hide suggestions' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    await userEvent.click(screen.getByRole('option', { name: 'Apple' }));
    await settle(fixture);
    await userEvent.click(screen.getByRole('option', { name: 'Cherry' }));
    await settle(fixture);
    expect(host.values()).toEqual(['apple', 'cherry']);
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute('data-state', 'checked');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('');

    // A disabled item does nothing; picking again deselects.
    await userEvent.click(screen.getByRole('option', { name: 'Banana' }));
    await userEvent.click(screen.getByRole('option', { name: 'Apple' }));
    await settle(fixture);
    expect(host.values()).toEqual(['cherry']);

    // The trigger closes it again; an outside click closes it too.
    await userEvent.click(screen.getByRole('button', { name: 'Hide suggestions' }));
    await settle(fixture);
    expect(screen.queryByRole('listbox')).toBeNull();
    await userEvent.click(input);
    await settle(fixture);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.click(document.body);
    await settle(fixture);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
