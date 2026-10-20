import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { TabsParts } from './tabs';

const TABS = (label: string) => `
  <ds-tabs [(value)]="value" (valueChange)="onChange($event)">
    <ds-tabs-list aria-label="${label}">
      <ds-tabs-trigger value="one">One</ds-tabs-trigger>
      <ds-tabs-trigger value="two" notification>Two</ds-tabs-trigger>
      <ds-tabs-trigger value="three" disabled>Three</ds-tabs-trigger>
    </ds-tabs-list>
    <ds-tabs-content value="one">Panel one</ds-tabs-content>
    <ds-tabs-content value="two">Panel two</ds-tabs-content>
    <ds-tabs-content value="three">Panel three</ds-tabs-content>
  </ds-tabs>
`;

describe('Tabs (styled)', () => {
  it('two instances on one page keep separate ids and keyboard focus', async () => {
    const onChange = vi.fn();
    const { fixture } = await render(
      `${TABS('First')}
       <ds-tabs value="one">
         <ds-tabs-list aria-label="Second">
           <ds-tabs-trigger value="one">One</ds-tabs-trigger>
           <ds-tabs-trigger value="two">Two</ds-tabs-trigger>
         </ds-tabs-list>
         <ds-tabs-content value="one">Other one</ds-tabs-content>
         <ds-tabs-content value="two">Other two</ds-tabs-content>
       </ds-tabs>`,
      { imports: [...TabsParts], componentProperties: { value: 'one', onChange } },
    );
    const ids = screen.getAllByRole('tab').map((tab) => tab.id);
    expect(new Set(ids).size).toBe(5);
    expect(screen.getByRole('tab', { name: /^Two\s*, unread updates$/ })).toBeInTheDocument();
    expect(screen.getByText('Panel one')).toBeVisible();
    expect(screen.queryByText('Panel two')).toBeNull();

    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    const [firstTwo, secondTwo] = screen.getAllByRole('tab', { name: /^Two/ });
    expect(firstTwo).toHaveFocus();
    expect(secondTwo).toHaveAttribute('aria-selected', 'false');
    expect(onChange).toHaveBeenLastCalledWith('two');
    expect(screen.getByText('Panel two')).toBeVisible();
    // The disabled tab is skipped: ArrowRight wraps back to the first.
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getAllByRole('tab', { name: 'One' })[0]).toHaveFocus();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('composes styled parts with the pills variant and a sliding indicator', async () => {
    const { fixture } = await render(
      `<ds-tabs value="a" variant="pills">
         <ds-tabs-list aria-label="View">
           <ds-tabs-trigger value="a">List</ds-tabs-trigger>
           <ds-tabs-trigger value="b">Board</ds-tabs-trigger>
         </ds-tabs-list>
         <ds-tabs-content value="a">List view</ds-tabs-content>
         <ds-tabs-content value="b">Board view</ds-tabs-content>
       </ds-tabs>`,
      { imports: [...TabsParts] },
    );
    expect(screen.getByRole('tablist').closest('ds-tabs')).toHaveAttribute('data-variant', 'pills');
    const indicator = document.querySelector('.tabs-indicator');
    expect(indicator).toHaveAttribute('data-state', 'visible');
    await userEvent.click(screen.getByRole('tab', { name: 'Board' }));
    await settle(fixture);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Board view');
  });
});
