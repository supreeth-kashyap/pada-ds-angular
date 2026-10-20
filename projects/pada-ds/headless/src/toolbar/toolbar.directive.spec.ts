import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DsToolbarParts } from './toolbar.directive';

describe('DsToolbar (headless)', () => {
  it('moves focus along a vertical toolbar without wrapping, skipping disabled items', async () => {
    const { fixture } = await render(
      `<div dsToolbar aria-label="Format" orientation="vertical" [loop]="false">
         <button type="button" dsToolbarItem disabled>Cut</button>
         <button type="button" dsToolbarItem>Bold</button>
         <button type="button" dsToolbarItem aria-disabled="true">Italic</button>
         <button type="button" dsToolbarItem>Underline</button>
       </div>`,
      { imports: [...DsToolbarParts] },
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Format' });
    expect(toolbar).toHaveAttribute('aria-orientation', 'vertical');
    const bold = screen.getByRole('button', { name: 'Bold' });
    const underline = screen.getByRole('button', { name: 'Underline' });
    // The first enabled item takes Tab.
    expect(bold).toHaveAttribute('tabindex', '0');
    await userEvent.tab();
    expect(bold).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(bold).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(underline).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(underline).toHaveFocus();
    await settle(fixture);
    expect(underline).toHaveAttribute('tabindex', '0');
    expect(bold).toHaveAttribute('tabindex', '-1');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('follows RTL for horizontal arrows, and items outside a toolbar are left alone', async () => {
    await render(
      `<div dsToolbar aria-label="Nav" dir="rtl">
         <button type="button" dsToolbarItem>One</button>
         <button type="button" dsToolbarItem>Two</button>
       </div>
       <button type="button" dsToolbarItem>Alone</button>`,
      { imports: [...DsToolbarParts] },
    );
    expect(screen.getByRole('button', { name: 'Alone' })).not.toHaveAttribute('tabindex');
    screen.getByRole('button', { name: 'One' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();
  });
});
