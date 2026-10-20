import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { SkeletonComponent } from './skeleton';

describe('SkeletonComponent', () => {
  it('stays out of the accessibility tree and renders one placeholder per line', async () => {
    const { container } = await render(
      `<div aria-busy="true"><ds-skeleton data-testid="lines" [lines]="3" /></div>`,
      { imports: [SkeletonComponent] },
    );
    const skeleton = screen.getByTestId('lines');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton).toHaveAttribute('data-lines', '3');
    const lines = skeleton.querySelectorAll('.skeleton');
    expect(lines).toHaveLength(3);
    expect(lines[2]).toHaveAttribute('data-last', '');
    expect(lines[0]).not.toHaveAttribute('data-last');
    await expectNoA11yViolations(container);
  });

  it('is a single placeholder sized through component tokens', async () => {
    await render(`<ds-skeleton data-testid="circle" shape="circle" [width]="40" height="3rem" />`, {
      imports: [SkeletonComponent],
    });
    const skeleton = screen.getByTestId('circle');
    expect(skeleton).toHaveAttribute('data-shape', 'circle');
    expect(skeleton).not.toHaveAttribute('data-lines');
    expect(skeleton.querySelector('.skeleton')).toBeNull();
    expect(skeleton.style.getPropertyValue('--pada-skeleton-width')).toBe('40px');
    expect(skeleton.style.getPropertyValue('--pada-skeleton-height')).toBe('3rem');
  });

  it('ignores lines for non-text shapes', async () => {
    await render(`<ds-skeleton data-testid="rect" shape="rect" [lines]="4" />`, {
      imports: [SkeletonComponent],
    });
    expect(screen.getByTestId('rect').querySelectorAll('.skeleton')).toHaveLength(0);
  });
});
