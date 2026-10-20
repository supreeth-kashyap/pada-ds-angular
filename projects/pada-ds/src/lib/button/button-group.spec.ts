import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { ButtonComponent } from './button';
import { ButtonGroupComponent } from './button-group';

describe('ButtonGroupComponent', () => {
  it('is a named group whose buttons take its size and variant unless they set their own', async () => {
    const { container } = await render(
      `<ds-button-group label="Text alignment" size="sm" variant="secondary" attached>
        <button dsButton>Left</button>
        <button dsButton>Center</button>
        <button dsButton variant="primary" size="lg">Right</button>
      </ds-button-group>`,
      { imports: [ButtonGroupComponent, ButtonComponent] },
    );
    const group = screen.getByRole('group', { name: 'Text alignment' });
    expect(group).toHaveAttribute('data-attached');
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expect(group).not.toHaveAttribute('aria-orientation');
    const left = screen.getByRole('button', { name: 'Left' });
    expect(left).toHaveAttribute('data-size', 'sm');
    expect(left).toHaveAttribute('data-variant', 'secondary');
    const right = screen.getByRole('button', { name: 'Right' });
    expect(right).toHaveAttribute('data-size', 'lg');
    expect(right).toHaveAttribute('data-variant', 'primary');
    await expectNoA11yViolations(container);
  });

  it('keeps one tab stop per button and supports a vertical layout', async () => {
    await render(
      `<ds-button-group label="Actions" orientation="vertical">
        <button dsButton>Copy</button>
        <button dsButton>Paste</button>
      </ds-button-group>`,
      { imports: [ButtonGroupComponent, ButtonComponent] },
    );
    const group = screen.getByRole('group', { name: 'Actions' });
    expect(group).toHaveAttribute('aria-orientation', 'vertical');
    expect(group).not.toHaveAttribute('data-attached');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Paste' })).toHaveFocus();
  });

  it('leaves buttons outside a group on their defaults', async () => {
    await render(`<button dsButton>Save</button>`, { imports: [ButtonComponent] });
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('data-size', 'md');
    expect(button).toHaveAttribute('data-variant', 'primary');
  });
});
