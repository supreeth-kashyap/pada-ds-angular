import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { ButtonComponent } from '../button/button';
import { DropdownMenuParts } from './dropdown-menu';

async function setup() {
  const onDelete = vi.fn();
  const onArchive = vi.fn();
  const result = await render(
    `<ds-dropdown-menu>
       <button dsButton variant="secondary" dsDropdownMenuTrigger>Actions</button>
       <ds-dropdown-menu-content>
         <ds-dropdown-menu-label>Item</ds-dropdown-menu-label>
         <ds-dropdown-menu-item icon="edit_1" shortcut="⌘E">Rename</ds-dropdown-menu-item>
         <ds-dropdown-menu-checkbox-item [(checked)]="pinned">Pinned</ds-dropdown-menu-checkbox-item>
         <ds-dropdown-menu-radio-group [(value)]="view" aria-label="View">
           <ds-dropdown-menu-radio-item value="list">List</ds-dropdown-menu-radio-item>
           <ds-dropdown-menu-radio-item value="grid">Grid</ds-dropdown-menu-radio-item>
         </ds-dropdown-menu-radio-group>
         <ds-dropdown-menu-sub>
           <ds-dropdown-menu-sub-trigger>Move to</ds-dropdown-menu-sub-trigger>
           <ds-dropdown-menu-sub-content>
             <ds-dropdown-menu-item (select)="onArchive()">Archive</ds-dropdown-menu-item>
           </ds-dropdown-menu-sub-content>
         </ds-dropdown-menu-sub>
         <ds-dropdown-menu-separator />
         <ds-dropdown-menu-item tone="danger" (select)="onDelete()">Delete</ds-dropdown-menu-item>
       </ds-dropdown-menu-content>
     </ds-dropdown-menu>`,
    {
      imports: [...DropdownMenuParts, ButtonComponent],
      componentProperties: { pinned: true, view: 'list', onDelete, onArchive },
    },
  );
  const trigger = screen.getByRole('button', { name: 'Actions' });
  const press = async (keys: string) => {
    await userEvent.keyboard(keys);
    await settle(result.fixture);
  };
  const click = async (element: HTMLElement) => {
    await userEvent.click(element);
    await settle(result.fixture);
  };
  return { ...result, trigger, onDelete, onArchive, press, click };
}

describe('DropdownMenu (styled)', () => {
  it('renders styled items with indicators, shortcuts and tones', async () => {
    const { trigger, click, onDelete, fixture } = await setup();
    await click(trigger);
    const menu = screen.getByRole('menu', { name: 'Actions' });
    expect(menu).toHaveClass('menu');
    expect(menu).toHaveFocus();
    expect(screen.getByRole('menuitem', { name: /Rename/ })).toHaveTextContent('⌘E');
    expect(screen.getByRole('menuitemcheckbox', { name: 'Pinned' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitemradio', { name: 'List' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute('data-tone', 'danger');
    await expectNoA11yViolations(fixture.nativeElement);

    await click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('toggles checkbox and radio items through two-way bindings', async () => {
    const { trigger, click, fixture } = await setup();
    await click(trigger);
    await click(screen.getByRole('menuitemcheckbox', { name: 'Pinned' }));
    expect(fixture.componentInstance).toMatchObject({ pinned: false });
    await click(trigger);
    await click(screen.getByRole('menuitemradio', { name: 'Grid' }));
    expect(fixture.componentInstance).toMatchObject({ view: 'grid' });
  });

  it('opens a styled submenu from the keyboard and runs its item', async () => {
    const { trigger, press, onArchive, fixture } = await setup();
    trigger.focus();
    await press('{Enter}');
    await press('m');
    const subTrigger = screen.getByRole('menuitem', { name: 'Move to' });
    expect(subTrigger).toHaveFocus();
    await press('{ArrowRight}');
    expect(subTrigger).toHaveAttribute('data-state', 'open');
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
    await expectNoA11yViolations(fixture.nativeElement);
    await press('{Enter}');
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveFocus();
  });
});
