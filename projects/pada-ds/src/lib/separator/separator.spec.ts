import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { SeparatorComponent } from './separator';

describe('SeparatorComponent', () => {
  it('stays out of the accessibility tree unless it is meaningful', async () => {
    const { container } = await render(
      `<ds-separator data-testid="decorative" />
       <ds-separator [decorative]="false" orientation="vertical" />`,
      { imports: [SeparatorComponent] },
    );
    const decorative = screen.getByTestId('decorative');
    expect(decorative).toHaveAttribute('role', 'none');
    expect(decorative).not.toHaveAttribute('aria-orientation');
    expect(decorative).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
    await expectNoA11yViolations(container);
  });
});
