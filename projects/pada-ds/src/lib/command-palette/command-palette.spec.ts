import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { CommandPaletteCommand, CommandPaletteComponent } from './command-palette';
import { commandScore } from './command-score';

describe('commandScore', () => {
  it('ranks exact > prefix > word start > substring > fuzzy > none', () => {
    const scores = [
      commandScore('Settings', 'settings'),
      commandScore('Settings', 'set'),
      commandScore('Open settings', 'set'),
      commandScore('Reset theme', 'set'),
      commandScore('Sort entries', 'stn'),
      commandScore('Help', 'xyz'),
    ];
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(scores[5]).toBe(0);
  });
});

function makeCommands(onSelect: (id: string) => void): CommandPaletteCommand[] {
  return [
    {
      id: 'new',
      label: 'New project',
      group: 'Projects',
      icon: 'add',
      shortcut: ['⌘', 'N'],
      onSelect: () => onSelect('new'),
    },
    {
      id: 'archive',
      label: 'Archive project',
      group: 'Projects',
      onSelect: () => onSelect('archive'),
    },
    {
      id: 'prefs',
      label: 'Preferences',
      group: 'Settings',
      keywords: ['settings', 'options'],
      onSelect: () => onSelect('prefs'),
    },
    {
      id: 'theme',
      label: 'Toggle theme',
      group: 'Settings',
      disabled: true,
      onSelect: () => onSelect('theme'),
    },
  ];
}

const options = () => screen.getAllByRole('option').map((option) => option.textContent?.trim());

async function setup(open = false) {
  const onSelect = vi.fn();
  const run = vi.fn();
  const result = await render(CommandPaletteComponent, {
    inputs: { commands: makeCommands(onSelect), open },
    on: { run },
  });
  await settle(result.fixture);
  return { ...result, onSelect, run };
}

describe('CommandPaletteComponent', () => {
  it('opens with Ctrl+K, filters by label and keywords, and runs with Enter', async () => {
    const { fixture, onSelect, run } = await setup();
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.keyboard('{Control>}k{/Control}');
    await settle(fixture);
    const dialog = screen.getByRole('dialog', { name: 'Command palette' });
    const input = screen.getByRole('combobox', { name: 'Command palette' });
    expect(dialog).toContainElement(input);
    expect(input).toHaveFocus();
    expect(screen.getByRole('group', { name: 'Projects' })).toBeInTheDocument();
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: /New project/ }).id,
    );
    await expectNoA11yViolations(fixture.nativeElement);

    await userEvent.type(input, 'settings');
    await settle(fixture);
    expect(options()).toEqual(['Preferences']);
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Preferences' }).id,
    );
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(onSelect).toHaveBeenCalledWith('prefs');
    expect(run).toHaveBeenCalledWith(expect.objectContaining({ id: 'prefs' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ranks matches while searching', async () => {
    const { fixture } = await setup(true);
    await userEvent.type(screen.getByRole('combobox'), 'pro');
    await settle(fixture);
    // "Preferences" only matches fuzzily, "project" labels at a word start.
    expect(options()[0]).toMatch(/project/);
  });

  it('moves with arrows past disabled commands, wrapping, and shows the empty state', async () => {
    const { fixture } = await setup(true);
    const input = screen.getByRole('combobox');
    for (const key of ['{ArrowDown}', '{ArrowDown}', '{ArrowDown}']) {
      await userEvent.keyboard(key);
      await settle(fixture);
    }
    // New → Archive → Preferences → (Toggle theme is disabled) → New.
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: /New project/ }).id,
    );
    await userEvent.keyboard('{ArrowUp}');
    await settle(fixture);
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Preferences' }).id,
    );
    await userEvent.type(input, 'zzzz');
    await settle(fixture);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('runs a command on click, and Escape closes', async () => {
    const { fixture, onSelect } = await setup(true);
    await userEvent.click(screen.getByRole('option', { name: 'Archive project' }));
    await settle(fixture);
    expect(onSelect).toHaveBeenCalledWith('archive');
    expect(screen.queryByRole('dialog')).toBeNull();

    await userEvent.keyboard('{Control>}k{/Control}');
    await settle(fixture);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
