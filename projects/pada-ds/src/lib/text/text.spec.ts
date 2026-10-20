import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { TextComponent, TextSize, TextWeight } from './text';

describe('TextComponent', () => {
  it('sets the type scale through attributes and keeps the host element', async () => {
    const { container } = await render(
      `<h2 dsText [size]="size" [weight]="weight" family="mono" lineHeight="sm">Billing</h2>`,
      {
        imports: [TextComponent],
        componentProperties: { size: TextSize['2XL'], weight: TextWeight.SEMIBOLD },
      },
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Billing' });
    expect(heading).toHaveAttribute('data-size', '2xl');
    expect(heading).toHaveAttribute('data-weight', '600');
    expect(heading).toHaveAttribute('data-family', 'mono');
    expect(heading).toHaveAttribute('data-line-height', 'sm');
    await expectNoA11yViolations(container);
  });

  it('defaults to base size, normal weight and the foreground colour', async () => {
    await render(`<span dsText data-testid="text" color="red">Hello</span>`, {
      imports: [TextComponent],
    });
    const text = screen.getByTestId('text');
    expect(text).toHaveAttribute('data-size', 'base');
    expect(text).toHaveAttribute('data-weight', '400');
    expect(text).not.toHaveAttribute('data-family');
    expect(text.style.color).toBe('red');
  });
});
