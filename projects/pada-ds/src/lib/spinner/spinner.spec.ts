import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { SpinnerComponent } from './spinner';

describe('SpinnerComponent', () => {
  it('is a status with a label', async () => {
    const { container } = await render(`<ds-spinner label="Saving" size="lg" />`, {
      imports: [SpinnerComponent],
    });
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Saving');
    expect(status).toHaveAttribute('data-size', 'lg');
    expect(status.querySelector('.spinner-ring')).toHaveAttribute('aria-hidden', 'true');
    await expectNoA11yViolations(container);
  });

  it('says "Loading" by default and is silent without a label', async () => {
    await render(`<ds-spinner /><ds-spinner data-testid="silent" [label]="null" />`, {
      imports: [SpinnerComponent],
    });
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    const silent = screen.getByTestId('silent');
    expect(silent).not.toHaveAttribute('role');
    expect(silent).toHaveTextContent('');
  });
});
