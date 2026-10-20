import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { ProgressComponent } from './progress';

describe('ProgressComponent', () => {
  it('is a progressbar named by its label, with its value', async () => {
    const { container } = await render(
      `<ds-progress label="Uploading" [value]="30" [max]="60" />`,
      {
        imports: [ProgressComponent],
      },
    );
    const bar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(bar).toHaveAttribute('aria-valuenow', '30');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '60');
    expect((bar.querySelector('.progress-indicator') as HTMLElement).style.width).toBe('50%');
    await expectNoA11yViolations(container);
  });

  it('falls back to an aria-label and clamps the fill', async () => {
    const { container } = await render(`<ds-progress [value]="150" />`, {
      imports: [ProgressComponent],
    });
    const bar = screen.getByRole('progressbar', { name: 'Progress' });
    expect((bar.querySelector('.progress-indicator') as HTMLElement).style.width).toBe('100%');
    expect(container.querySelector('.progress-label')).toBeNull();
  });
});

describe('ProgressComponent states', () => {
  it('is indeterminate without a value: no aria-valuenow, and a sweeping fill', async () => {
    const { container } = await render(`<ds-progress label="Preparing" [value]="null" />`, {
      imports: [ProgressComponent],
    });
    const bar = screen.getByRole('progressbar', { name: 'Preparing' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).not.toHaveAttribute('aria-valuetext');
    expect(bar).toHaveAttribute('data-state', 'indeterminate');
    expect(bar.querySelector('.progress-indicator')).toHaveAttribute(
      'data-state',
      'indeterminate',
    );
    await expectNoA11yViolations(container);
  });

  it('shows the value, announces it as text, and reports loading and complete', async () => {
    const { rerender, container } = await render(
      `<ds-progress label="Uploading" [value]="value" showValue />`,
      { imports: [ProgressComponent], componentProperties: { value: 42.4 } },
    );
    const bar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(bar).toHaveAttribute('aria-valuetext', '42%');
    expect(bar).toHaveAttribute('data-state', 'loading');
    expect(container.querySelector('.progress-value')).toHaveTextContent('42%');
    await rerender({ componentProperties: { value: 100 } });
    expect(bar).toHaveAttribute('data-state', 'complete');
    expect(container.querySelector('ds-progress')).toHaveAttribute('data-state', 'complete');
  });
});
