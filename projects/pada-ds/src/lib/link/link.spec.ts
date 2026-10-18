import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { LinkComponent } from './link';

describe('LinkComponent', () => {
  it('external links open safely and say so', async () => {
    const { container } = await render(`<a dsLink href="https://example.com" external>Docs</a>`, {
      imports: [LinkComponent],
    });
    const link = screen.getByRole('link', { name: 'Docs (opens in a new tab)' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expectNoA11yViolations(container);
  });

  it('styles a plain link with tone and underline attributes', async () => {
    await render(`<a dsLink href="/settings" tone="neutral" underline="always">Settings</a>`, {
      imports: [LinkComponent],
    });
    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link).toHaveClass('link');
    expect(link).toHaveAttribute('data-tone', 'neutral');
    expect(link).toHaveAttribute('data-underline', 'always');
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });
});
