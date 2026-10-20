import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { ComboBoxComponent, ComboBoxItem, ComboBoxItemClick } from './combo-box';

const items: ComboBoxItem[] = [
  { id: 'owner', label: 'Owner', iconName: 'team' },
  { id: 'admin', label: 'Admin', disabled: true },
  { id: 'editor', label: 'Editor', selected: true },
  { id: 'viewer', label: 'Viewer' },
];

describe('ComboBoxComponent', () => {
  it('is one tab stop on the selected option, and arrows, Home and End move focus', async () => {
    const { fixture } = await render(
      `<button>Before</button><ds-combo-box aria-label="Role" [items]="items" />`,
      { imports: [ComboBoxComponent], componentProperties: { items } },
    );
    await settle(fixture);
    const listbox = screen.getByRole('listbox', { name: 'Role' });
    expect(listbox).not.toHaveAttribute('aria-multiselectable');
    const option = (name: string) => screen.getByRole('option', { name });
    expect(option('Editor')).toHaveAttribute('aria-selected', 'true');
    expect(option('Editor')).toHaveAttribute('tabindex', '0');
    expect(option('Owner')).toHaveAttribute('tabindex', '-1');

    await userEvent.click(screen.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    expect(option('Editor')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    // Admin is disabled and skipped.
    expect(option('Owner')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(option('Owner')).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(option('Viewer')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(option('Viewer')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(option('Owner')).toHaveFocus();
    await settle(fixture);
    // The tab stop follows the focused option.
    expect(option('Owner')).toHaveAttribute('tabindex', '0');
    expect(option('Editor')).toHaveAttribute('tabindex', '-1');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('reports clicks, marks multi-select lists and groups options under headings', async () => {
    const clicks: ComboBoxItemClick[] = [];
    const grouped: ComboBoxItem[] = [
      { id: 'a', label: 'Alpha', group: 'Greek', selected: true },
      { id: 'b', label: 'Beta', group: 'Greek' },
      { id: 'x', label: 'Ex', group: 'Latin' },
    ];
    const { fixture } = await render(
      `<ds-combo-box aria-label="Letters" multiSelect [items]="items" (itemClick)="onClick($event)" />`,
      {
        imports: [ComboBoxComponent],
        componentProperties: {
          items: grouped,
          onClick: (click: ComboBoxItemClick) => clicks.push(click),
        },
      },
    );
    await settle(fixture);
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    expect(screen.getByRole('group', { name: 'Greek' })).toContainElement(
      screen.getByRole('option', { name: 'Beta' }),
    );
    expect(screen.getByRole('group', { name: 'Latin' })).toContainElement(
      screen.getByRole('option', { name: 'Ex' }),
    );
    await userEvent.click(screen.getByRole('option', { name: 'Beta' }));
    expect(clicks).toEqual([{ item: grouped[1], index: 1 }]);
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('with an id, leaves focus to the owning combobox and marks the active option', async () => {
    const { fixture } = await render(
      `<ds-combo-box id="roles" aria-label="Role" [items]="items" />`,
      {
        imports: [ComboBoxComponent],
        componentProperties: { items: items.map((item, i) => ({ ...item, active: i === 3 })) },
      },
    );
    await settle(fixture);
    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.id)).toEqual([
      'roles-option-0',
      'roles-option-1',
      'roles-option-2',
      'roles-option-3',
    ]);
    expect(options.every((option) => option.getAttribute('tabindex') === '-1')).toBe(true);
    expect(options[3]).toHaveAttribute('data-active');
  });
});
