import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { TagsComponent } from './tags';

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
