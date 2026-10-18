import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { BadgeComponent } from './badge';

describe('BadgeComponent', () => {
  it('renders its label with tone, variant and size attributes', async () => {
    const { container } = await render(
      `<ds-badge data-testid="badge" tone="success" variant="outline" size="sm">Active</ds-badge>`,
      { imports: [BadgeComponent] },
    );
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('Active');
    expect(badge).toHaveAttribute('data-tone', 'success');
    expect(badge).toHaveAttribute('data-variant', 'outline');
    expect(badge).toHaveAttribute('data-size', 'sm');
    expect(badge.querySelector('.badge-dot')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('defaults to a neutral, subtle, md badge', async () => {
    await render(`<ds-badge data-testid="badge">Beta</ds-badge>`, { imports: [BadgeComponent] });
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-tone', 'neutral');
    expect(badge).toHaveAttribute('data-variant', 'subtle');
    expect(badge).toHaveAttribute('data-size', 'md');
  });

  it('caps counts and exposes tone and variant', async () => {
    await render(`<ds-badge data-testid="badge" tone="danger" variant="solid" [count]="120" />`, {
      imports: [BadgeComponent],
    });
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('99+');
    expect(badge).toHaveAttribute('data-tone', 'danger');
    expect(badge).toHaveAttribute('data-variant', 'solid');
  });

  it('re-creates the count label when the count changes, so it bumps', async () => {
    const { rerender } = await render(
      `<ds-badge data-testid="badge" [count]="count" [max]="9" />`,
      { imports: [BadgeComponent], componentProperties: { count: 3 } },
    );
    const first = screen.getByTestId('badge').querySelector('[data-count]');
    expect(first).toHaveTextContent('3');
    await rerender({ componentProperties: { count: 12 } });
    const second = screen.getByTestId('badge').querySelector('[data-count]');
    expect(second).toHaveTextContent('9+');
    expect(second).not.toBe(first);
  });

  it('shows a decorative leading dot', async () => {
    await render(`<ds-badge data-testid="badge" dot>Online</ds-badge>`, {
      imports: [BadgeComponent],
    });
    const dot = screen.getByTestId('badge').querySelector('.badge-dot');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
  });
});
