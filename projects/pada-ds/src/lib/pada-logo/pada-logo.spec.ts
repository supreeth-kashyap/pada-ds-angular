import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { PadaLogoComponent } from './pada-logo';

describe('PadaLogoComponent', () => {
  it('is an image named Pada, sized by height with the variant aspect ratio', async () => {
    const { container } = await render(`<ds-pada-logo size="lg" />`, {
      imports: [PadaLogoComponent],
    });
    const logo = screen.getByRole('img', { name: 'Pada' });
    expect(logo.tagName.toLowerCase()).toBe('svg');
    expect(logo).toHaveAttribute('height', '48');
    expect(logo).toHaveAttribute('width', String((48 * 110) / 32));
    expect(logo).toHaveAttribute('viewBox', '0 0 110 32');
    expect(logo).toHaveAttribute('data-variant', 'lockup');
    expect(logo).toHaveAttribute('data-tone', 'color');
    // Toes are drawn from 48px up.
    expect(logo.querySelectorAll('circle[r="1.5"]')).toHaveLength(2);
    expect(logo.querySelector('.pada-logo-wordmark')).toHaveAttribute(
      'transform',
      'translate(42 6.4)',
    );
    expect(container.querySelector('ds-pada-logo')).not.toHaveAttribute('title');
    await expectNoA11yViolations(container);
  });

  it('mark, decorative, and the looping loader', async () => {
    const { container } = await render(
      `<ds-pada-logo variant="mark" [size]="16" decorative />
       <ds-pada-logo variant="mark" animated="loop" />`,
      { imports: [PadaLogoComponent] },
    );
    const [decorative, loader] = Array.from(container.querySelectorAll('svg'));
    expect(decorative).toHaveAttribute('aria-hidden', 'true');
    expect(decorative).not.toHaveAttribute('role');
    expect(decorative.querySelectorAll('circle')).toHaveLength(0);
    expect(decorative.querySelector('.pada-logo-wordmark')).toBeNull();
    expect(screen.getByRole('status', { name: 'Loading' })).toBe(loader);
    expect(loader).toHaveAttribute('data-animated', 'loop');
    await expectNoA11yViolations(container);
  });

  it('wordmark alone, with a custom name, the enter animation and forced toes off', async () => {
    await render(
      `<ds-pada-logo variant="wordmark" title="Pada home" animated tone="mono" size="xl" [toes]="false" />`,
      { imports: [PadaLogoComponent] },
    );
    const logo = screen.getByRole('img', { name: 'Pada home' });
    expect(logo).toHaveAttribute('viewBox', '0 0 67 27');
    expect(logo).toHaveAttribute('data-animated', 'enter');
    expect(logo).toHaveAttribute('data-tone', 'mono');
    expect(logo.querySelector('.pada-logo-mark')).toBeNull();
    expect(logo.querySelector('.pada-logo-wordmark')).not.toHaveAttribute('transform');
  });
});
