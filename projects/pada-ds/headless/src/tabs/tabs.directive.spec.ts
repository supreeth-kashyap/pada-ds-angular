import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DsTabsParts } from './tabs.directive';

const EXAMPLE = `
  <div dsTabs [(value)]="value" [activationMode]="mode" (valueChange)="onValueChange($event)">
    <div dsTabsList aria-label="Project">
      <button dsTabsTrigger value="overview">Overview</button>
      <button dsTabsTrigger value="files" disabled>Files</button>
      <button dsTabsTrigger value="activity log">Activity</button>
      <span dsTabsIndicator data-testid="indicator"></span>
    </div>
    <div dsTabsContent value="overview">Overview panel</div>
    <div dsTabsContent value="files">Files panel</div>
    <div dsTabsContent value="activity log">Activity panel</div>
  </div>
`;

async function setup(template = EXAMPLE, mode = 'automatic') {
  const onValueChange = vi.fn();
  const result = await render(template, {
    imports: [...DsTabsParts],
    componentProperties: { value: 'overview', mode, onValueChange },
  });
  return { ...result, onValueChange };
}

describe('DsTabs', () => {
  it('wires tabs to panels with unique ids and roving tabindex', async () => {
    const { fixture } = await setup(EXAMPLE + EXAMPLE);
    const ids = screen.getAllByRole('tab').map((tab) => tab.id);
    expect(new Set(ids).size).toBe(ids.length);
    const [overview] = screen.getAllByRole('tab', { name: 'Overview' });
    expect(overview).toHaveAttribute('aria-selected', 'true');
    expect(overview).toHaveAttribute('tabindex', '0');
    expect(screen.getAllByRole('tab', { name: 'Activity' })[0]).toHaveAttribute('tabindex', '-1');
    const [panel] = screen.getAllByRole('tabpanel', { name: 'Overview' });
    expect(overview).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveTextContent('Overview panel');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('moves with arrow keys, skips disabled tabs, wraps, and selects on focus', async () => {
    const { onValueChange } = await setup();
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    const activity = screen.getByRole('tab', { name: 'Activity' });
    expect(activity).toHaveFocus();
    expect(activity).toHaveAttribute('aria-selected', 'true');
    expect(onValueChange).toHaveBeenLastCalledWith('activity log');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Activity panel');
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(activity).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(activity).toHaveFocus();
  });

  it('manual activation waits for Enter', async () => {
    await setup(EXAMPLE, 'manual');
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    const activity = screen.getByRole('tab', { name: 'Activity' });
    expect(activity).toHaveFocus();
    expect(activity).toHaveAttribute('aria-selected', 'false');
    await userEvent.keyboard('{Enter}');
    expect(activity).toHaveAttribute('aria-selected', 'true');
  });

  it('selects with a click and exposes indicator geometry', async () => {
    const { fixture } = await setup();
    await userEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    await settle(fixture);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Activity panel');
    const indicator = screen.getByTestId('indicator');
    expect(indicator.style.getPropertyValue('--pada-tabs-indicator-size')).toBe('0px');
    expect(indicator).toHaveAttribute('data-state', 'visible');
    expect(indicator).toHaveAttribute('aria-hidden', 'true');
  });

  it('follows the vertical orientation', async () => {
    await setup(EXAMPLE.replace('<div dsTabs', '<div dsTabs orientation="vertical"'));
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveFocus();
  });
});
