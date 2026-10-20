import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { MenubarParts } from './menubar';

async function setup() {
  const onNew = vi.fn();
  const onValueChange = vi.fn();
  const result = await render(
    `<ds-menubar aria-label="Editor" (valueChange)="onValueChange($event)">
       <ds-menubar-menu value="file">
         <ds-menubar-trigger>File</ds-menubar-trigger>
         <ds-menubar-content>
           <ds-dropdown-menu-item shortcut="⌘N" (select)="onNew()">New file</ds-dropdown-menu-item>
           <ds-dropdown-menu-item>Open…</ds-dropdown-menu-item>
           <ds-dropdown-menu-sub>
             <ds-dropdown-menu-sub-trigger>Open recent</ds-dropdown-menu-sub-trigger>
             <ds-dropdown-menu-sub-content>
               <ds-dropdown-menu-item>notes.md</ds-dropdown-menu-item>
             </ds-dropdown-menu-sub-content>
           </ds-dropdown-menu-sub>
         </ds-menubar-content>
       </ds-menubar-menu>
       <ds-menubar-menu value="edit">
         <ds-menubar-trigger>Edit</ds-menubar-trigger>
         <ds-menubar-content>
           <ds-dropdown-menu-item>Undo</ds-dropdown-menu-item>
           <ds-dropdown-menu-item>Redo</ds-dropdown-menu-item>
         </ds-menubar-content>
       </ds-menubar-menu>
       <ds-menubar-menu value="view">
         <ds-menubar-trigger>View</ds-menubar-trigger>
         <ds-menubar-content>
           <ds-dropdown-menu-checkbox-item [checked]="true">Word wrap</ds-dropdown-menu-checkbox-item>
         </ds-menubar-content>
       </ds-menubar-menu>
     </ds-menubar>`,
    { imports: [...MenubarParts], componentProperties: { onNew, onValueChange } },
  );
  const press = async (keys: string) => {
    await userEvent.keyboard(keys);
    await settle(result.fixture);
  };
  const item = (name: string | RegExp) => screen.getByRole('menuitem', { name });
  return { ...result, onNew, onValueChange, press, item };
}

describe('Menubar', () => {
  it('is a labelled menubar with one Tab stop', async () => {
    const { fixture } = await setup();
    const bar = screen.getByRole('menubar', { name: 'Editor' });
    expect(bar).toHaveAttribute('aria-orientation', 'horizontal');
    const [file, edit, view] = screen.getAllByRole('menuitem');
    expect(file).toHaveAttribute('tabindex', '0');
    expect(edit).toHaveAttribute('tabindex', '-1');
    expect(view).toHaveAttribute('aria-haspopup', 'menu');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('moves along the bar with the arrow keys, Home and End', async () => {
    const { press, item } = await setup();
    await press('{Tab}');
    expect(item('File')).toHaveFocus();
    await press('{ArrowRight}');
    expect(item('Edit')).toHaveFocus();
    expect(item('Edit')).toHaveAttribute('tabindex', '0');
    expect(item('File')).toHaveAttribute('tabindex', '-1');
    await press('{End}');
    expect(item('View')).toHaveFocus();
    await press('{ArrowRight}');
    expect(item('File')).toHaveFocus();
    await press('{Home}');
    expect(item('File')).toHaveFocus();
  });

  it('opens a menu on ArrowDown, and Escape returns to its trigger', async () => {
    const { press, item, onValueChange, fixture } = await setup();
    await press('{Tab}');
    await press('{ArrowDown}');
    expect(onValueChange).toHaveBeenLastCalledWith('file');
    expect(screen.getByRole('menu', { name: 'File' })).toBeInTheDocument();
    expect(item(/New file/)).toHaveFocus();
    await expectNoA11yViolations(fixture.nativeElement);
    await press('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(item('File')).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith('');
  });

  it('moves between open menus with ArrowRight and ArrowLeft', async () => {
    const { press, item } = await setup();
    await press('{Tab}');
    await press('{Enter}');
    await press('{ArrowRight}');
    expect(screen.getByRole('menu', { name: 'Edit' })).toBeInTheDocument();
    expect(item('Undo')).toHaveFocus();
    expect(screen.queryByRole('menu', { name: 'File' })).toBeNull();
    await press('{ArrowLeft}');
    expect(item(/New file/)).toHaveFocus();
    await press('{ArrowLeft}');
    // Wraps round to the last menu.
    expect(screen.getByRole('menuitemcheckbox', { name: 'Word wrap' })).toHaveFocus();
    // Escape after switching still returns to the open menu's trigger.
    await press('{Escape}');
    expect(item('View')).toHaveFocus();
  });

  it('opens a submenu with ArrowRight on its trigger instead of the next menu', async () => {
    const { press, item } = await setup();
    await press('{Tab}');
    await press('{ArrowUp}');
    expect(item('Open recent')).toHaveFocus();
    await press('{ArrowRight}');
    expect(item('notes.md')).toHaveFocus();
    await press('{ArrowLeft}');
    expect(item('Open recent')).toHaveFocus();
    expect(screen.getByRole('menu', { name: 'File' })).toBeInTheDocument();
    // From inside a submenu, ArrowRight on a plain item moves to the next menu.
    await press('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('menu', { name: 'Edit' })).toBeInTheDocument();
    expect(item('Undo')).toHaveFocus();
  });

  it('switches menus on hover once one is open, and closes after a choice', async () => {
    const { item, onNew, fixture } = await setup();
    await userEvent.click(item('File'));
    await settle(fixture);
    expect(screen.getByRole('menu', { name: 'File' })).toBeInTheDocument();
    fireEvent.pointerEnter(item('View'));
    await settle(fixture);
    expect(screen.getByRole('menu', { name: 'View' })).toBeInTheDocument();
    expect(screen.queryByRole('menu', { name: 'File' })).toBeNull();
    fireEvent.pointerEnter(item('File'));
    await settle(fixture);
    await userEvent.click(item(/New file/));
    await settle(fixture);
    expect(onNew).toHaveBeenCalled();
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
