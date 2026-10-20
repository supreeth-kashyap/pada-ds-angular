import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle, settleUntil } from '../../../testing/settle';
import { ButtonComponent } from '../button/button';
import { TooltipParts } from './tooltip';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function setup() {
  const result = await render(
    `<ds-tooltip-provider [delayDuration]="50" [skipDelayDuration]="200">
       <ds-tooltip>
         <button dsButton dsTooltipTrigger aria-label="Delete">×</button>
         <ds-tooltip-content>Delete permanently<ds-tooltip-arrow /></ds-tooltip-content>
       </ds-tooltip>
       <ds-tooltip>
         <button dsButton dsTooltipTrigger>Share</button>
         <ds-tooltip-content>Copy a link</ds-tooltip-content>
       </ds-tooltip>
     </ds-tooltip-provider>`,
    { imports: [...TooltipParts, ButtonComponent] },
  );
  return {
    ...result,
    remove: screen.getByRole('button', { name: 'Delete' }),
    share: screen.getByRole('button', { name: 'Share' }),
  };
}

type Fixture = Awaited<ReturnType<typeof setup>>['fixture'];

async function hoverFor(element: HTMLElement, fixture: Fixture, ms: number) {
  await userEvent.hover(element);
  await wait(ms);
  await settle(fixture);
}

describe('Tooltip', () => {
  it('opens immediately on keyboard focus and describes the trigger while open', async () => {
    const { fixture, remove } = await setup();
    expect(remove).toHaveAttribute('data-state', 'closed');
    await userEvent.tab();
    await settle(fixture);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Delete permanently');
    expect(tooltip).toHaveAttribute('data-side', 'top');
    expect(tooltip).toHaveAttribute('data-state', 'open');
    expect(remove).toHaveAttribute('data-state', 'open');
    expect(remove).toHaveAccessibleDescription('Delete permanently');
    expect(tooltip.querySelector('ds-tooltip-arrow')).toHaveAttribute('aria-hidden', 'true');
    // The tooltip never takes focus.
    expect(remove).toHaveFocus();
    await expectNoA11yViolations(fixture.nativeElement);

    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(remove).not.toHaveAttribute('aria-describedby');
    expect(remove).toHaveFocus();
  });

  it('opens on hover after the delay and closes after leaving', async () => {
    const { fixture, remove } = await setup();
    await userEvent.hover(remove);
    await settle(fixture);
    expect(screen.queryByRole('tooltip')).toBeNull();
    await settleUntil(fixture, () =>
      expect(screen.getByRole('tooltip')).toHaveTextContent('Delete permanently'),
    );
    await userEvent.unhover(remove);
    await settleUntil(fixture, () => expect(screen.queryByRole('tooltip')).toBeNull());
  });

  it('skips the delay when moving to the next trigger soon after', async () => {
    const { fixture, remove, share } = await setup();
    await hoverFor(remove, fixture, 80);
    await userEvent.unhover(remove);
    await wait(150);
    await settle(fixture);
    await userEvent.hover(share);
    await settle(fixture);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copy a link');
  });

  it('closes on pointer-down and does not reopen from the click focus', async () => {
    const { fixture, remove } = await setup();
    await hoverFor(remove, fixture, 80);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await userEvent.click(remove);
    await settle(fixture);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('closes on blur, and stays open while the pointer moves onto it', async () => {
    const { fixture, remove } = await setup();
    await userEvent.tab();
    await settle(fixture);
    const tooltip = screen.getByRole('tooltip');
    await userEvent.unhover(remove);
    await userEvent.hover(tooltip);
    await wait(200);
    await settle(fixture);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await userEvent.tab();
    await settle(fixture);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copy a link');
    expect(screen.getAllByRole('tooltip')).toHaveLength(1);
  });

  it('keeps an existing description and appends its own while open', async () => {
    const { fixture } = await render(
      `<span id="hint">Shortcut A</span>
       <ds-tooltip>
         <button dsTooltipTrigger aria-describedby="hint">Archive</button>
         <ds-tooltip-content side="bottom">Archive this record</ds-tooltip-content>
       </ds-tooltip>`,
      { imports: [...TooltipParts] },
    );
    const trigger = screen.getByRole('button', { name: 'Archive' });
    expect(trigger).toHaveAttribute('aria-describedby', 'hint');
    expect(screen.queryByRole('tooltip')).toBeNull();

    await userEvent.tab();
    await settle(fixture);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('tooltip');
    expect(tooltip).toHaveAttribute('data-side', 'bottom');
    expect(trigger).toHaveAttribute('aria-describedby', `hint ${tooltip.id}`);
    expect(trigger).toHaveAccessibleDescription('Shortcut A Archive this record');

    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(trigger).toHaveAttribute('aria-describedby', 'hint');
  });

  it('opens after 300ms by default', async () => {
    // Tooltips outside a provider share one group; let the previous test's close cool down.
    await wait(320);
    const { fixture } = await render(
      `<ds-tooltip>
         <button dsTooltipTrigger>Archive</button>
         <ds-tooltip-content>Archive this record</ds-tooltip-content>
       </ds-tooltip>`,
      { imports: [...TooltipParts] },
    );
    await hoverFor(screen.getByRole('button'), fixture, 200);
    expect(screen.queryByRole('tooltip')).toBeNull();
    await wait(150);
    await settle(fixture);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});
