import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { GridComponent } from './grid';

describe('Grid', () => {
  it('sets columns and gaps from inputs', async () => {
    const { fixture } = await render(
      `<ds-grid data-testid="fixed" columns="3" gap="2" rowGap="6" align="center"><div></div></ds-grid>`,
      { imports: [GridComponent] },
    );
    const grid = screen.getByTestId('fixed');
    expect(grid.style.getPropertyValue('--pada-grid-columns')).toBe('3');
    expect(grid.style.getPropertyValue('--pada-grid-gap')).toBe('var(--pada-space-2)');
    expect(grid.style.getPropertyValue('--pada-grid-row-gap')).toBe('var(--pada-space-6)');
    expect(grid).toHaveAttribute('data-align', 'center');
    expect(grid).not.toHaveAttribute('data-fit');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('fits as many columns as there is room for, on any element', async () => {
    await render(`<ul dsGrid minItemWidth="16rem"><li>One</li></ul>`, {
      imports: [GridComponent],
    });
    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('data-fit', '');
    expect(list.style.getPropertyValue('--pada-grid-min-item-width')).toBe('16rem');
    expect(list.style.getPropertyValue('--pada-grid-row-gap')).toBe('var(--pada-space-4)');
  });
});
