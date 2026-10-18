import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { ButtonComponent } from './button';

describe('ButtonComponent', () => {
  it('defaults to type="button" and exposes size and variant attributes', async () => {
    await render(`<form><button dsButton size="sm" variant="secondary">Save</button></form>`, {
      imports: [ButtonComponent],
    });
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toHaveAttribute('data-variant', 'secondary');
  });

  it('still submits forms when asked to', async () => {
    await render(`<button dsButton type="submit">Send</button>`, { imports: [ButtonComponent] });
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit');
  });

  it('loading keeps focus and width, announces busy, and ignores clicks', async () => {
    const onClick = vi.fn();
    const { rerender } = await render(
      `<button dsButton [loading]="loading" (click)="onClick()">Save</button>`,
      {
        imports: [ButtonComponent],
        componentProperties: { loading: false, onClick },
      },
    );
    const button = screen.getByRole('button', { name: 'Save' });
    button.focus();
    await rerender({ componentProperties: { loading: true, onClick } });
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(button.querySelector('.button-spinner')).not.toBeNull();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();

    await rerender({ componentProperties: { loading: false, onClick } });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders icons from the built-in set, hidden from assistive technology', async () => {
    await render(`<button dsButton leftIcon="add">Add</button>`, { imports: [ButtonComponent] });
    const icon = screen.getByRole('button', { name: 'Add' }).querySelector('ds-icon')!;
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    await waitFor(() => expect(icon.querySelector('svg')).not.toBeNull());
  });

  it('works on links', async () => {
    await render(`<a dsButton href="/docs" variant="ghost">Docs</a>`, {
      imports: [ButtonComponent],
    });
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('data-variant', 'ghost');
    expect(link).not.toHaveAttribute('type');
    await expectNoA11yViolations(link.parentElement!);
  });
});
