import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { ButtonComponent } from '../button/button';
import { AlertComponent } from './alert';

describe('AlertComponent', () => {
  it('is silent by default, with a tone icon, title and message', async () => {
    const { container } = await render(
      `<ds-alert data-testid="alert" title="Heads up">Body</ds-alert>`,
      { imports: [AlertComponent] },
    );
    const alert = screen.getByTestId('alert');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    expect(alert).toHaveAttribute('data-tone', 'info');
    expect(alert).not.toHaveAttribute('title');
    expect(alert.querySelector('.alert-title')).toHaveTextContent('Heads up');
    expect(alert.querySelector('.alert-description')).toHaveTextContent('Body');
    expect(alert.querySelector('ds-icon')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('announces when live and dismisses through the output', async () => {
    const onDismiss = vi.fn();
    const { container } = await render(
      `<ds-alert tone="danger" live="assertive" title="Payment failed" dismissible (dismiss)="onDismiss()">
         Check your card.
         <button dsButton dsAlertActions variant="secondary">Update card</button>
       </ds-alert>`,
      { imports: [AlertComponent, ButtonComponent], componentProperties: { onDismiss } },
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Payment failed');
    expect(container.querySelector('.alert-actions')).toContainElement(
      screen.getByRole('button', { name: 'Update card' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await expectNoA11yViolations(container);
  });

  it('uses role="status" for polite alerts and can hide the icon', async () => {
    await render(`<ds-alert live="polite" tone="success" [icon]="false">Saved.</ds-alert>`, {
      imports: [AlertComponent],
    });
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Saved.');
    expect(status.querySelector('ds-icon')).toBeNull();
  });

  it('accepts a custom icon', async () => {
    await render(`<ds-alert data-testid="alert" icon="bell">Reminder</ds-alert>`, {
      imports: [AlertComponent],
    });
    expect(screen.getByTestId('alert').querySelector('.alert-icon')).not.toBeNull();
  });
});
