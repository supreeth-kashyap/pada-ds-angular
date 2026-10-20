import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { ButtonComponent } from '../button/button';
import { AlertDialogParts } from './alert-dialog';

async function setup(onDelete: (event: Event) => void = () => {}) {
  const result = await render(
    `<button id="outside">Outside</button>
     <ds-alert-dialog>
       <button dsButton variant="destructive" dsDialogTrigger>Delete project</button>
       <ds-alert-dialog-content>
         <ds-dialog-header>
           <ds-dialog-title>Delete this project?</ds-dialog-title>
           <ds-dialog-description>This cannot be undone.</ds-dialog-description>
         </ds-dialog-header>
         <ds-dialog-footer>
           <button dsButton variant="destructive" dsAlertDialogAction (click)="onDelete($event)">
             Delete
           </button>
           <button dsButton variant="secondary" dsAlertDialogCancel>Cancel</button>
         </ds-dialog-footer>
       </ds-alert-dialog-content>
     </ds-alert-dialog>`,
    { imports: [...AlertDialogParts, ButtonComponent], componentProperties: { onDelete } },
  );
  const trigger = screen.getByRole('button', { name: 'Delete project' });
  await userEvent.click(trigger);
  await settle(result.fixture);
  return { ...result, trigger };
}

describe('AlertDialog', () => {
  it('is a labelled, described alertdialog that focuses Cancel', async () => {
    const { fixture } = await setup();
    const dialog = screen.getByRole('alertdialog', { name: 'Delete this project?' });
    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('data-size', 'sm');
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
    // Cancel comes after Delete in the DOM, yet gets the initial focus.
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('ignores pointer-downs outside but closes on Escape', async () => {
    const { fixture, trigger } = await setup();
    fireEvent.pointerDown(document.getElementById('outside')!);
    await settle(fixture);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('runs the action and closes', async () => {
    const onDelete = vi.fn();
    const { fixture } = await setup(onDelete);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await settle(fixture);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('stays open when the action prevents the click', async () => {
    const { fixture } = await setup((event) => event.preventDefault());
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await settle(fixture);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await settle(fixture);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
