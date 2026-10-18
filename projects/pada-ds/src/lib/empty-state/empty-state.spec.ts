import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { ButtonComponent } from '../button/button';
import { EmptyStateComponent } from './empty-state';

describe('EmptyStateComponent', () => {
  it('renders a heading at the requested level, a description and actions', async () => {
    const { container } = await render(
      `<ds-empty-state data-testid="empty" media="empty" title="No projects yet"
         description="Create one to start." [headingLevel]="2">
         <button dsButton>New project</button>
       </ds-empty-state>`,
      { imports: [EmptyStateComponent, ButtonComponent] },
    );
    expect(screen.getByRole('heading', { level: 2, name: 'No projects yet' })).toBeInTheDocument();
    expect(screen.getByText('Create one to start.')).toBeInTheDocument();
    expect(container.querySelector('.empty-state-actions')).toContainElement(
      screen.getByRole('button', { name: 'New project' }),
    );
    expect(container.querySelector('.empty-state-media')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('empty')).toHaveAttribute('data-size', 'md');
    expect(screen.getByTestId('empty')).not.toHaveAttribute('title');
    await expectNoA11yViolations(container);
  });

  it('defaults to an h3, and projects custom media', async () => {
    const { container } = await render(
      `<ds-empty-state title="Nothing found" size="sm"><svg dsEmptyStateMedia></svg></ds-empty-state>`,
      { imports: [EmptyStateComponent] },
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Nothing found' })).toBeInTheDocument();
    expect(container.querySelector('.empty-state-media svg')).not.toBeNull();
    expect(container.querySelector('.empty-state-description')).toBeNull();
  });
});
