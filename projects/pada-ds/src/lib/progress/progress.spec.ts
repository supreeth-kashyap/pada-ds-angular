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
