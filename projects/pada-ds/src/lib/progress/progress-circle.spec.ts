import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { ProgressCircleComponent } from './progress-circle';

describe('ProgressCircleComponent', () => {
  it('is a named progressbar whose ring fills by percentage', async () => {
    const { container } = await render(
      `<ds-progress-circle label="Uploading" [value]="15" [max]="60" />`,
      { imports: [ProgressCircleComponent] },
    );
    const ring = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(ring).toHaveAttribute('aria-valuenow', '15');
    expect(ring).toHaveAttribute('aria-valuemin', '0');
    expect(ring).toHaveAttribute('aria-valuemax', '60');
    expect(ring).toHaveAttribute('aria-valuetext', '25%');
    expect(ring).toHaveAttribute('data-state', 'loading');
    expect(ring).toHaveAttribute('data-size', 'md');
    expect(ring.style.getPropertyValue('--pada-progress-circle-percentage')).toBe('25');
    expect(ring.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expectNoA11yViolations(container);
  });

  it('spins without a value, leaving out aria-valuenow', async () => {
    const { container } = await render(`<ds-progress-circle label="Syncing" size="sm" />`, {
      imports: [ProgressCircleComponent],
    });
    const ring = screen.getByRole('progressbar', { name: 'Syncing' });
    expect(ring).not.toHaveAttribute('aria-valuenow');
    expect(ring).toHaveAttribute('data-state', 'indeterminate');
    expect(ring).toHaveAttribute('data-size', 'sm');
    expect(container.querySelector('.progress-circle-indicator')).toHaveAttribute(
      'data-state',
      'indeterminate',
    );
    await expectNoA11yViolations(container);
  });

  it('clamps, marks an empty ring, shows the value inside, and reports completion', async () => {
    const { rerender, container } = await render(
      `<ds-progress-circle label="Storage" [value]="value" size="lg" showValue />`,
      { imports: [ProgressCircleComponent], componentProperties: { value: 0 } },
    );
    const ring = screen.getByRole('progressbar', { name: 'Storage' });
    expect(container.querySelector('.progress-circle-indicator')).toHaveAttribute('data-empty');
    expect(container.querySelector('.progress-circle-value')).toHaveTextContent('0%');
    await rerender({ componentProperties: { value: 140 } });
    expect(ring).toHaveAttribute('data-state', 'complete');
    expect(ring.style.getPropertyValue('--pada-progress-circle-percentage')).toBe('100');
    expect(container.querySelector('.progress-circle-value')).toHaveTextContent('100%');
  });
});
