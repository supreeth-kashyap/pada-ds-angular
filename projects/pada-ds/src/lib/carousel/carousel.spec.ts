import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { CarouselParts } from './carousel';

const slides = `
  <ds-carousel-slide><p>First</p></ds-carousel-slide>
  <ds-carousel-slide><p>Second</p></ds-carousel-slide>
  <ds-carousel-slide><p>Third</p></ds-carousel-slide>`;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Carousel', () => {
  it('is a labelled carousel region with slide groups and current-dot state', async () => {
    const { fixture } = await render(
      `<ds-carousel label="Highlights" [autoPlay]="false">${slides}</ds-carousel>`,
      { imports: [...CarouselParts] },
    );
    await settle(fixture);
    expect(screen.getByRole('region', { name: 'Highlights' })).toHaveAttribute(
      'aria-roledescription',
      'carousel',
    );
    const group = screen.getByRole('group', { name: '1 of 3' });
    expect(group).toHaveTextContent('First');
    expect(group).toHaveAttribute('aria-roledescription', 'slide');
    expect(screen.getAllByRole('group')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Slide 1' })).toHaveAttribute('aria-current', 'true');
    // Not rotating: no rotation button, and changes are announced.
    expect(screen.queryByRole('button', { name: /automatic slide show/ })).toBeNull();
    expect(group.parentElement).toHaveAttribute('aria-live', 'polite');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('moves with previous, next and the dots, wrapping round', async () => {
    const { fixture } = await render(`<ds-carousel [autoPlay]="false">${slides}</ds-carousel>`, {
      imports: [...CarouselParts],
    });
    await settle(fixture);
    await userEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    await settle(fixture);
    expect(screen.getByRole('group', { name: '3 of 3' })).toHaveTextContent('Third');
    await userEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    await settle(fixture);
    expect(screen.getByRole('group', { name: '1 of 3' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Slide 2' }));
    await settle(fixture);
    expect(screen.getByRole('group', { name: '2 of 3' })).toHaveTextContent('Second');
    expect(screen.getByRole('button', { name: 'Slide 2' })).toHaveAttribute('aria-current', 'true');
  });

  it('auto-rotates, pauses on hover, and can be stopped with the rotation button', async () => {
    const { fixture } = await render(`<ds-carousel [interval]="60">${slides}</ds-carousel>`, {
      imports: [...CarouselParts],
    });
    await settle(fixture);
    const region = screen.getByRole('region');
    expect(screen.getByRole('group', { name: '1 of 3' }).parentElement).toHaveAttribute(
      'aria-live',
      'off',
    );
    // Wait (up to 2s, for slow machines) for the first automatic advance.
    for (let tries = 0; tries < 40 && screen.queryByRole('group', { name: '1 of 3' }); tries++) {
      await wait(50);
      await settle(fixture);
    }
    expect(screen.queryByRole('group', { name: '1 of 3' })).toBeNull();

    region.dispatchEvent(new PointerEvent('pointerenter'));
    await settle(fixture);
    const shown = screen.getByRole('group').getAttribute('aria-label');
    await wait(200);
    await settle(fixture);
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', shown);
    region.dispatchEvent(new PointerEvent('pointerleave'));
    await settle(fixture);

    await userEvent.click(screen.getByRole('button', { name: 'Stop automatic slide show' }));
    await settle(fixture);
    expect(screen.getByRole('button', { name: 'Start automatic slide show' })).toBeInTheDocument();
  });

  it('pauses while focus is inside', async () => {
    const { fixture } = await render(`<ds-carousel [interval]="50">${slides}</ds-carousel>`, {
      imports: [...CarouselParts],
    });
    await settle(fixture);
    await userEvent.tab();
    await settle(fixture);
    const before = screen.getByRole('group').getAttribute('aria-label');
    await wait(150);
    await settle(fixture);
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', before);
  });

  it('does not rotate when the user prefers reduced motion', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) =>
      ({
        matches: query.includes('reduce'),
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
    try {
      const { fixture } = await render(`<ds-carousel [interval]="40">${slides}</ds-carousel>`, {
        imports: [...CarouselParts],
      });
      await settle(fixture);
      await wait(100);
      await settle(fixture);
      expect(screen.getByRole('group', { name: '1 of 3' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /automatic slide show/ })).toBeNull();
    } finally {
      window.matchMedia = original;
    }
  });
});
