import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DsResizableParts } from './resizable.directive';

describe('DsResizable', () => {
  it('works on plain elements with three panels, each handle resizing the panel before it', async () => {
    const { fixture } = await render(
      `<div dsResizable>
         <div dsResizablePanel id="nav" [defaultSize]="20">Nav</div>
         <div dsResizableHandle aria-label="Resize navigation"></div>
         <div dsResizablePanel data-testid="main">Main</div>
         <div dsResizableHandle aria-label="Resize main"></div>
         <div dsResizablePanel data-testid="aside" [defaultSize]="20" [minSize]="10">Aside</div>
       </div>`,
      { imports: [...DsResizableParts] },
    );
    await settle(fixture);
    const [first, second] = screen.getAllByRole('separator');
    expect(first).toHaveAttribute('aria-controls', 'nav');
    expect(second).toHaveAttribute('aria-controls', screen.getByTestId('main').id);
    expect(second).toHaveAttribute('aria-valuenow', '60');
    // Main can grow until the aside reaches its minimum.
    expect(second).toHaveAttribute('aria-valuemax', '70');

    second.focus();
    await userEvent.keyboard('{End}');
    await settle(fixture);
    expect(screen.getByTestId('aside')).toHaveAttribute('data-size', '10');
    expect(first).toHaveAttribute('aria-valuenow', '20');
    // Enter does nothing on a panel that cannot collapse.
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(second).toHaveAttribute('aria-valuenow', '70');
    await expectNoA11yViolations(fixture.nativeElement);
  });
});
