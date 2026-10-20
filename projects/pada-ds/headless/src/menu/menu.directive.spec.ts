import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DsPresence } from '../utils/presence';
import { DsDropdownMenuParts, MenuSelectEvent } from './menu.directive';

const TEMPLATE = `
  <button id="outside">Outside</button>
  <ng-container dsDropdownMenu #menu="dsDropdownMenu">
    <button dsDropdownMenuTrigger>Actions</button>
    <div *dsPresence="menu.open()" dsDropdownMenuContent>
      <div dsDropdownMenuItem (select)="onRename($event)">Rename</div>
      <div dsDropdownMenuItem disabled>Duplicate</div>
      <div dsDropdownMenuCheckboxItem [(checked)]="pinned">
        <span dsDropdownMenuItemIndicator>✓</span>Pinned
      </div>
      <div dsDropdownMenuSeparator></div>
      <div dsDropdownMenuRadioGroup [(value)]="sort" aria-label="Sort by">
        <div dsDropdownMenuRadioItem value="name">Name</div>
        <div dsDropdownMenuRadioItem value="date">Date</div>
      </div>
      <div role="none" dsDropdownMenuSub #sub="dsDropdownMenuSub">
        <div dsDropdownMenuSubTrigger>Move to</div>
        <div *dsPresence="sub.open()" dsDropdownMenuSubContent>
          <div dsDropdownMenuItem (select)="onArchive()">Archive</div>
          <div dsDropdownMenuItem>Trash</div>
        </div>
      </div>
    </div>
  </ng-container>
`;

async function setup(keepOpen = false) {
  const onRename = vi.fn((event: MenuSelectEvent) => keepOpen && event.preventDefault());
  const onArchive = vi.fn();
  const result = await render(TEMPLATE, {
    imports: [...DsDropdownMenuParts, DsPresence],
    componentProperties: { pinned: false, sort: 'name', onRename, onArchive },
  });
  const trigger = screen.getByRole('button', { name: 'Actions' });
  const press = async (keys: string) => {
    await userEvent.keyboard(keys);
    await settle(result.fixture);
  };
  return { ...result, trigger, onRename, onArchive, press };
}

describe('DsDropdownMenu', () => {
  it('opens from the keyboard onto the first item, labelled by its trigger', async () => {
    const { trigger, press, fixture } = await setup();
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    trigger.focus();
    await press('{Enter}');
    const menu = screen.getByRole('menu', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', menu.id);
    const rename = screen.getByRole('menuitem', { name: 'Rename' });
    expect(rename).toHaveFocus();
    expect(rename).toHaveAttribute('data-highlighted');
    expect(menu).toHaveAttribute('data-state', 'open');
    expect(menu).toHaveAttribute('data-side', 'bottom');
    expect(menu).toHaveAttribute('data-align', 'start');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('ArrowUp on the trigger opens onto the last item', async () => {
    const { trigger, press } = await setup();
    trigger.focus();
    await press('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Move to' })).toHaveFocus();
  });

  it('moves with arrows, skips disabled items, wraps, and supports Home/End and type-ahead', async () => {
    const { trigger, press } = await setup();
    trigger.focus();
    await press('{Enter}');
    await press('{ArrowDown}');
    expect(screen.getByRole('menuitemcheckbox', { name: /Pinned/ })).toHaveFocus();
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await press('{ArrowUp}{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Move to' })).toHaveFocus();
    await press('{Home}');
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
    await press('{End}');
    expect(screen.getByRole('menuitem', { name: 'Move to' })).toHaveFocus();
    await press('d');
    expect(screen.getByRole('menuitemradio', { name: 'Date' })).toHaveFocus();
  });

  it('selecting an item emits select, closes the menu and returns focus to the trigger', async () => {
    const { trigger, press, onRename } = await setup();
    trigger.focus();
    await press('{Enter}');
    await press('{Enter}');
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('keeps the menu open when select is prevented', async () => {
    const { trigger, press, onRename } = await setup(true);
    trigger.focus();
    await press('{Enter}');
    await press('{Enter}');
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('checkbox and radio items report their state with aria-checked', async () => {
    const { trigger, fixture } = await setup();
    const click = async (element: HTMLElement) => {
      await userEvent.click(element);
      await settle(fixture);
    };
    await click(trigger);
    expect(screen.getByRole('menuitemcheckbox', { name: /Pinned/ })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(document.querySelector('[dsDropdownMenuItemIndicator]')).toHaveAttribute('hidden');
    await click(screen.getByRole('menuitemcheckbox', { name: /Pinned/ }));
    expect(screen.queryByRole('menu')).toBeNull();
    await click(trigger);
    const pinned = screen.getByRole('menuitemcheckbox', { name: /Pinned/ });
    expect(pinned).toHaveAttribute('aria-checked', 'true');
    expect(pinned).toHaveAttribute('data-state', 'checked');
    expect(document.querySelector('[dsDropdownMenuItemIndicator]')).not.toHaveAttribute('hidden');
    expect(screen.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await click(screen.getByRole('menuitemradio', { name: 'Date' }));
    await click(trigger);
    expect(screen.getByRole('menuitemradio', { name: 'Date' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('opens a submenu with ArrowRight and closes it with ArrowLeft, back on its trigger', async () => {
    const { trigger, press, onArchive, fixture } = await setup();
    trigger.focus();
    await press('{ArrowUp}');
    const subTrigger = screen.getByRole('menuitem', { name: 'Move to' });
    expect(subTrigger).toHaveAttribute('aria-haspopup', 'menu');
    await press('{ArrowRight}');
    expect(subTrigger).toHaveAttribute('aria-expanded', 'true');
    const submenu = screen.getByRole('menu', { name: 'Move to' });
    expect(submenu).toHaveAttribute('data-side', 'right');
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
    await expectNoA11yViolations(fixture.nativeElement);
    await press('{ArrowLeft}');
    expect(screen.queryByRole('menuitem', { name: 'Archive' })).toBeNull();
    expect(subTrigger).toHaveFocus();

    await press('{Enter}');
    await press('{Enter}');
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('Escape closes only the submenu, then the menu', async () => {
    const { trigger, press } = await setup();
    trigger.focus();
    await press('{ArrowUp}{ArrowRight}');
    expect(screen.getAllByRole('menu')).toHaveLength(2);
    await press('{Escape}');
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    await press('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('Tab closes the menu', async () => {
    const { trigger, press } = await setup();
    trigger.focus();
    await press('{Enter}');
    await press('{Tab}');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('a click toggles the menu without highlighting an item', async () => {
    const { trigger, fixture } = await setup();
    await userEvent.click(trigger);
    await settle(fixture);
    expect(screen.getByRole('menu')).toHaveFocus();
    await userEvent.click(trigger);
    await settle(fixture);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes on an outside click', async () => {
    const { trigger, fixture } = await setup();
    await userEvent.click(trigger);
    await settle(fixture);
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));
    await settle(fixture);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens a submenu on hover and highlights items under the pointer', async () => {
    const { trigger, fixture } = await setup();
    await userEvent.click(trigger);
    await settle(fixture);
    await userEvent.hover(screen.getByRole('menuitem', { name: 'Rename' }));
    await settle(fixture);
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
    await userEvent.hover(screen.getByRole('menuitem', { name: 'Move to' }));
    await settle(fixture);
    expect(screen.getByRole('menu', { name: 'Move to' })).toBeInTheDocument();
  });
});
