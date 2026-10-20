import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { HeadingComponent } from './heading';

describe('HeadingComponent', () => {
  it('keeps the native heading level and sizes it by level', async () => {
    const { container } = await render(
      `<h1 dsHeading>Billing</h1><h2 dsHeading>Plan</h2><h3 dsHeading>Payment method</h3>`,
      { imports: [HeadingComponent] },
    );
    const h1 = screen.getByRole('heading', { level: 1, name: 'Billing' });
    expect(h1).toHaveAttribute('data-level', '1');
    expect(h1).toHaveAttribute('data-size', '3xl');
    expect(h1).toHaveAttribute('data-weight', '600');
    expect(screen.getByRole('heading', { level: 3 })).toHaveAttribute('data-size', 'xl');
    await expectNoA11yViolations(container);
  });

  it('sizes the lower levels down to sm', async () => {
    await render(`<h5 dsHeading>Notes</h5><h6 dsHeading>Footnote</h6>`, {
      imports: [HeadingComponent],
    });
    expect(screen.getByRole('heading', { level: 5 })).toHaveAttribute('data-size', 'base');
    expect(screen.getByRole('heading', { level: 6 })).toHaveAttribute('data-size', 'sm');
  });

  it('lets size and weight override the level defaults without changing the level', async () => {
    await render(`<h2 dsHeading size="lg" weight="700">Members</h2>`, {
      imports: [HeadingComponent],
    });
    const heading = screen.getByRole('heading', { level: 2, name: 'Members' });
    expect(heading).toHaveAttribute('data-size', 'lg');
    expect(heading).toHaveAttribute('data-weight', '700');
    expect(heading).not.toHaveAttribute('style');
  });
});
