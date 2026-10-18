import { fireEvent, render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { ScrollAreaComponent } from './scroll-area';

/** jsdom has no layout: give the element a size and a scroll position by hand. */
function fakeLayout(element: HTMLElement, layout: { client: number; scroll: number; top: number }) {
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: layout.client });
  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: layout.scroll });
  Object.defineProperty(element, 'scrollTop', { configurable: true, value: layout.top });
}

describe('ScrollArea', () => {
  it('is a plain, unfocusable box while nothing overflows', async () => {
    const { fixture } = await render(
      `<ds-scroll-area data-testid="area" maxHeight="320" aria-label="Activity"><p>Short</p></ds-scroll-area>`,
      { imports: [ScrollAreaComponent] },
    );
    await settle(fixture);
    const area = screen.getByTestId('area');
    expect(area).not.toHaveAttribute('tabindex');
    expect(area).not.toHaveAttribute('role');
    expect(area).not.toHaveAttribute('data-overflowing');
    expect(area).toHaveAttribute('data-orientation', 'vertical');
    expect(area).toHaveAttribute('data-scrollbar', 'auto');
    expect(area).toHaveAttribute('data-fade', '');
    expect(area.style.getPropertyValue('--pada-scroll-area-max-height')).toBe('320px');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('becomes a focusable, named region when content overflows, and tracks its edges', async () => {
    const { fixture } = await render(
      `<ds-scroll-area data-testid="area" maxHeight="50vh" aria-label="Activity">
         <p>Long</p>
       </ds-scroll-area>`,
      { imports: [ScrollAreaComponent] },
    );
    const area = screen.getByTestId('area');
    fakeLayout(area, { client: 100, scroll: 400, top: 0 });
    fireEvent.scroll(area);
    await settle(fixture);
    const region = screen.getByRole('region', { name: 'Activity' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region).toHaveAttribute('data-overflowing', '');
    expect(region).toHaveAttribute('data-at-start', '');
    expect(region).not.toHaveAttribute('data-at-end');
    expect(region.style.getPropertyValue('--pada-scroll-area-max-height')).toBe('50vh');

    fakeLayout(area, { client: 100, scroll: 400, top: 150 });
    fireEvent.scroll(area);
    await settle(fixture);
    expect(region).not.toHaveAttribute('data-at-start');
    expect(region).not.toHaveAttribute('data-at-end');

    fakeLayout(area, { client: 100, scroll: 400, top: 300 });
    fireEvent.scroll(area);
    await settle(fixture);
    expect(region).toHaveAttribute('data-at-end', '');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('keeps a tabindex and role set by the consumer, and can turn the fade off', async () => {
    await render(
      `<ds-scroll-area data-testid="area" tabindex="-1" role="log" [fade]="false" scrollbar="always" orientation="horizontal" [maxWidth]="200">
         <p>Line</p>
       </ds-scroll-area>`,
      { imports: [ScrollAreaComponent] },
    );
    const area = screen.getByTestId('area');
    expect(area).toHaveAttribute('tabindex', '-1');
    expect(area).toHaveAttribute('role', 'log');
    expect(area).not.toHaveAttribute('data-fade');
    expect(area).toHaveAttribute('data-scrollbar', 'always');
    expect(area).toHaveAttribute('data-orientation', 'horizontal');
    expect(area.style.getPropertyValue('--pada-scroll-area-max-width')).toBe('200px');
  });
});
