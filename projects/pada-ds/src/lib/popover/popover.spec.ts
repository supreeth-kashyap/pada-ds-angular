import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { ButtonComponent } from '../button/button';
import { PopoverParts } from './popover';

async function setup(modal = false) {
  const result = await render(
    `<button id="outside">Outside</button>
     <ds-popover [modal]="modal">
       <button dsButton dsPopoverTrigger>Filters</button>
       <ds-popover-content side="top" align="start">
         <ds-popover-title>Filters</ds-popover-title>
         <button dsButton>Apply</button>
         <ds-popover-arrow />
         <ds-popover-close-button />
       </ds-popover-content>
     </ds-popover>`,
    { imports: [...PopoverParts, ButtonComponent], componentProperties: { modal } },
  );
  const trigger = screen.getByRole('button', { name: 'Filters' });
  return { ...result, trigger };
}

type Fixture = Awaited<ReturnType<typeof setup>>['fixture'];

async function open(trigger: HTMLElement, fixture: Fixture) {
  await userEvent.click(trigger);
  await settle(fixture);
}

describe('Popover', () => {
  it('opens a labelled dialog next to its trigger and moves focus in', async () => {
    const { trigger, fixture } = await setup();
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).toBeNull();

    await open(trigger, fixture);
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', dialog.id);
    expect(dialog).toHaveAttribute('data-state', 'open');
    expect(dialog).toHaveAttribute('data-side', 'top');
    expect(dialog).toHaveAttribute('data-align', 'start');
    expect(dialog).not.toHaveAttribute('aria-modal');
    expect(dialog.querySelector('ds-popover-arrow')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const { trigger, fixture } = await setup();
    await open(trigger, fixture);
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('closes when focus moves outside, and from the close button', async () => {
    const { trigger, fixture } = await setup();
    await open(trigger, fixture);
    screen.getByRole('button', { name: 'Outside' }).focus();
    await settle(fixture);
    expect(screen.queryByRole('dialog')).toBeNull();

    await open(trigger, fixture);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await settle(fixture);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('toggles from the trigger without the outside click reopening it', async () => {
    const { trigger, fixture } = await setup();
    await open(trigger, fixture);
    await open(trigger, fixture);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('traps focus when modal', async () => {
    const { trigger, fixture } = await setup(true);
    await open(trigger, fixture);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus();
  });
});
