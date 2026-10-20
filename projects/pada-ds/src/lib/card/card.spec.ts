import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { CardComponent } from './card';

describe('CardComponent', () => {
  it('projects its content', async () => {
    const { container } = await render(
      `<ds-card data-testid="card"><h3>Usage</h3><p>42 of 50 seats used.</p></ds-card>`,
      { imports: [CardComponent] },
    );
    const card = screen.getByTestId('card');
    expect(card).toContainElement(screen.getByRole('heading', { name: 'Usage' }));
    expect(card).toHaveTextContent('42 of 50 seats used.');
    await expectNoA11yViolations(container);
  });
});
