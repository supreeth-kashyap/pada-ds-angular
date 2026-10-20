import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { ButtonComponent } from './button';
import { ButtonSplitterComponent, SplitButtonParts } from './split-button';

describe('SplitButtonComponent', () => {
  it('joins a main action and a named chevron button that share the variant and size', async () => {
    const save = vi.fn();
    const more = vi.fn();
    const { container } = await render(
      `<ds-split-button variant="secondary" size="sm" label="Save options">
        <button dsButton (click)="save()">Save</button>
        <button dsButtonSplitter (click)="more()"></button>
      </ds-split-button>`,
      { imports: [...SplitButtonParts, ButtonComponent], componentProperties: { save, more } },
    );
    expect(screen.getByRole('group', { name: 'Save options' })).toHaveAttribute(
      'data-variant',
      'secondary',
    );
    const main = screen.getByRole('button', { name: 'Save' });
    const splitter = screen.getByRole('button', { name: 'More options' });
    for (const button of [main, splitter]) {
      expect(button).toHaveAttribute('data-variant', 'secondary');
      expect(button).toHaveAttribute('data-size', 'sm');
      expect(button).toHaveAttribute('type', 'button');
    }
    expect(splitter.querySelector('ds-icon')).toHaveAttribute('aria-hidden', 'true');

    await userEvent.click(splitter);
    expect(more).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
    await userEvent.click(main);
    expect(save).toHaveBeenCalledTimes(1);

    main.focus();
    await userEvent.tab();
    expect(splitter).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(more).toHaveBeenCalledTimes(2);
    await expectNoA11yViolations(container);
  });

  it('defaults to primary, takes a custom label, and can be disabled', async () => {
    await render(
      `<ds-split-button>
        <button dsButton>Publish</button>
        <button dsButtonSplitter label="Publish options" disabled></button>
      </ds-split-button>`,
      { imports: [...SplitButtonParts, ButtonComponent] },
    );
    const splitter = screen.getByRole('button', { name: 'Publish options' });
    expect(splitter).toHaveAttribute('data-variant', 'primary');
    expect(splitter).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Publish' })).toHaveAttribute(
      'data-variant',
      'primary',
    );
  });

  it('works on its own with its own variant', async () => {
    await render(`<button dsButtonSplitter variant="secondary"></button>`, {
      imports: [ButtonSplitterComponent],
    });
    expect(screen.getByRole('button', { name: 'More options' })).toHaveAttribute(
      'data-variant',
      'secondary',
    );
  });
});
