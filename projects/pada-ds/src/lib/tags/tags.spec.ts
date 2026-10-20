import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { TagComponent, TagsComponent } from './tags';

describe('TagsComponent', () => {
  it('renders the label with its variant and a decorative icon', async () => {
    const { container } = await render(
      `<ds-tags data-testid="tag" variant="success" icon="tick_1">Approved</ds-tags>`,
      { imports: [TagsComponent] },
    );
    const tag = screen.getByTestId('tag');
    expect(tag).toHaveTextContent('Approved');
    expect(tag).toHaveAttribute('data-variant', 'success');
    expect(tag.querySelector('ds-icon')).toHaveAttribute('aria-hidden', 'true');
    await expectNoA11yViolations(container);
  });

  it('defaults to neutral, with no icon', async () => {
    await render(`<ds-tags data-testid="tag">Draft</ds-tags>`, { imports: [TagsComponent] });
    expect(screen.getByTestId('tag')).toHaveAttribute('data-variant', 'neutral');
    expect(screen.getByTestId('tag').querySelector('ds-icon')).toBeNull();
  });

  it('projects a custom leading visual', async () => {
    const { container } = await render(
      `<ds-tags variant="royal"><span dsTagsIcon>★</span>Starred</ds-tags>`,
      { imports: [TagsComponent] },
    );
    expect(container.querySelector('.tags-icon-slot')).toHaveTextContent('★');
    expect(container.querySelector('.tags-content')).toHaveTextContent('Starred');
  });
});

describe('TagsComponent removable', () => {
  it('adds a remove button named after the tag, emitting remove on click, Delete and Backspace', async () => {
    const remove = vi.fn();
    const { container } = await render(
      `<ds-tag removable variant="primary" (remove)="remove()">Design</ds-tag>`,
      { imports: [TagComponent], componentProperties: { remove } },
    );
    const button = screen.getByRole('button', { name: 'Remove Design' });
    expect(button).toHaveAttribute('type', 'button');
    expect(container.querySelector('ds-tag')).toHaveAttribute('data-removable');
    expect(container.querySelector('ds-tag')).not.toHaveAttribute('role');
    await userEvent.click(button);
    await userEvent.keyboard('{Delete}');
    await userEvent.keyboard('{Backspace}');
    expect(remove).toHaveBeenCalledTimes(3);
    await expectNoA11yViolations(container);
  });

  it('takes a custom verb and can be disabled', async () => {
    const remove = vi.fn();
    await render(
      `<ds-tags removable removeLabel="Clear" disabled (remove)="remove()">Q3</ds-tags>`,
      { imports: [TagsComponent], componentProperties: { remove } },
    );
    const button = screen.getByRole('button', { name: 'Clear Q3' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(remove).not.toHaveBeenCalled();
  });
});
