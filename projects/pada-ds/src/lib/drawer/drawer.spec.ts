import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { ButtonComponent } from '../button/button';
import { DrawerParts } from './drawer';

async function setup(side = 'right', size = 'sm') {
  const result = await render(
    `<button id="outside">Outside</button>
     <ds-drawer>
       <button dsButton dsDialogTrigger>Filters</button>
       <ds-drawer-content [side]="side" [size]="size">
         <ds-dialog-header>
           <ds-dialog-title>Filters</ds-dialog-title>
           <ds-dialog-description>Narrow the results.</ds-dialog-description>
         </ds-dialog-header>
         <ds-dialog-body><input aria-label="Search" /></ds-dialog-body>
         <ds-dialog-footer><button dsButton dsDialogClose>Apply</button></ds-dialog-footer>
         <ds-dialog-close-button />
       </ds-drawer-content>
     </ds-drawer>`,
    { imports: [...DrawerParts, ButtonComponent], componentProperties: { side, size } },
  );
  const trigger = screen.getByRole('button', { name: 'Filters' });
  await userEvent.click(trigger);
  await settle(result.fixture);
  return { ...result, trigger };
}

describe('Drawer', () => {
  it('opens as a labelled modal dialog on its side and moves focus in', async () => {
    const { fixture, trigger } = await setup();
    const drawer = screen.getByRole('dialog', { name: 'Filters' });
    expect(drawer.tagName).toBe('DIALOG');
    expect(drawer).toHaveClass('drawer');
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(drawer).toHaveAttribute('data-side', 'right');
    expect(drawer).toHaveAttribute('data-size', 'sm');
    expect(drawer).toHaveAttribute('data-state', 'open');
    expect(drawer).toHaveAccessibleDescription('Narrow the results.');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('takes side and size', async () => {
    await setup('bottom', 'lg');
    const drawer = screen.getByRole('dialog');
    expect(drawer).toHaveAttribute('data-side', 'bottom');
    expect(drawer).toHaveAttribute('data-size', 'lg');
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const { fixture, trigger } = await setup();
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('closes from the close button, a close part and a pointer-down outside', async () => {
    const { fixture, trigger } = await setup();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await settle(fixture);
    expect(screen.queryByRole('dialog')).toBeNull();

    await userEvent.click(trigger);
    await settle(fixture);
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await settle(fixture);
    expect(screen.queryByRole('dialog')).toBeNull();

    await userEvent.click(trigger);
    await settle(fixture);
    fireEvent.pointerDown(document.getElementById('outside')!);
    await settle(fixture);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('traps Tab inside', async () => {
    await setup();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus();
  });
});
