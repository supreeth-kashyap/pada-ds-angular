import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { ContextMenuParts } from './context-menu';

async function setup(disabled = false) {
  const onRename = vi.fn();
  const result = await render(
    `<ds-context-menu>
       <ds-context-menu-trigger tabindex="0" [disabled]="disabled">Report.pdf</ds-context-menu-trigger>
       <ds-context-menu-content ariaLabel="File actions">
         <ds-dropdown-menu-item (select)="onRename()">Rename</ds-dropdown-menu-item>
         <ds-dropdown-menu-item>Duplicate</ds-dropdown-menu-item>
         <ds-dropdown-menu-separator />
         <ds-dropdown-menu-item tone="danger">Delete</ds-dropdown-menu-item>
       </ds-context-menu-content>
     </ds-context-menu>`,
    { imports: [...ContextMenuParts], componentProperties: { onRename, disabled } },
  );
  const area = screen.getByText('Report.pdf');
  return { ...result, area, onRename };
}

describe('ContextMenu', () => {
  it('opens at the pointer on right-click with focus on the first item', async () => {
    const { area, fixture } = await setup();
    const notPrevented = fireEvent.contextMenu(area, { clientX: 120, clientY: 80 });
    expect(notPrevented).toBe(false); // the browser menu is suppressed
    await settle(fixture);
    const menu = screen.getByRole('menu', { name: 'File actions' });
    expect(menu).not.toHaveAttribute('aria-labelledby');
    expect(area).toHaveAttribute('data-state', 'open');
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('works from the keyboard, runs the chosen item and returns focus to the area', async () => {
    const { area, onRename, fixture } = await setup();
    area.focus();
    // Shift+F10 fires a contextmenu event with no pointer position.
    fireEvent.contextMenu(area, { clientX: 0, clientY: 0 });
    await settle(fixture);
    await userEvent.keyboard('{ArrowDown}{ArrowUp}{Enter}');
    await settle(fixture);
    expect(onRename).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(area).toHaveFocus();
  });

  it('opens on a long press with touch', async () => {
    vi.useFakeTimers();
    try {
      const { area, fixture } = await setup();
      fireEvent.pointerDown(area, { pointerType: 'touch', clientX: 10, clientY: 10 });
      vi.advanceTimersByTime(650);
      vi.useRealTimers();
      await settle(fixture);
      expect(screen.getByRole('menu', { name: 'File actions' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('can be disabled to keep the browser menu', async () => {
    const { area, fixture } = await setup(true);
    expect(fireEvent.contextMenu(area)).toBe(true);
    await settle(fixture);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(area).toHaveAttribute('data-disabled');
  });
});
