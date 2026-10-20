import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { IconButtonComponent } from './icon-button';

describe('IconButtonComponent', () => {
  it('is named by its label, ghost by default, with a decorative icon', async () => {
    const { container } = await render(
      `<button dsIconButton icon="edit_1" label="Rename"></button>`,
      {
        imports: [IconButtonComponent],
      },
    );
    const button = screen.getByRole('button', { name: 'Rename' });
    expect(button).toHaveClass('button', 'icon-button');
    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-size', 'md');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toHaveAttribute('title');
    expect(button.querySelector('ds-icon')).toHaveAttribute('aria-hidden', 'true');
    await expectNoA11yViolations(container);
  });

  it('can show its label as a tooltip', async () => {
    await render(`<button dsIconButton icon="edit_1" label="Rename" tooltip></button>`, {
      imports: [IconButtonComponent],
    });
    expect(screen.getByRole('button', { name: 'Rename' })).toHaveAttribute('title', 'Rename');
  });

  it('ignores clicks while loading and announces busy', async () => {
    const onClick = vi.fn();
    const { rerender } = await render(
      `<button dsIconButton icon="refresh_2" label="Refresh" variant="secondary" size="sm" [loading]="loading" (click)="onClick()"></button>`,
      { imports: [IconButtonComponent], componentProperties: { loading: true, onClick } },
    );
    const button = screen.getByRole('button', { name: 'Refresh' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('.button-spinner')).not.toBeNull();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    await rerender({ componentProperties: { loading: false, onClick } });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('works on links', async () => {
    await render(`<a dsIconButton href="/help" icon="help" label="Help"></a>`, {
      imports: [IconButtonComponent],
    });
    const link = screen.getByRole('link', { name: 'Help' });
    expect(link).not.toHaveAttribute('type');
  });
});
