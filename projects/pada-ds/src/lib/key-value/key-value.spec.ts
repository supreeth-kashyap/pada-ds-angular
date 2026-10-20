import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { KeyValueComponent } from './key-value';

describe('KeyValueComponent', () => {
  it('renders the label and the projected value, without an info button by default', async () => {
    const { container } = await render(
      `<ds-key-value label="Plan"><strong>Enterprise</strong></ds-key-value>`,
      { imports: [KeyValueComponent] },
    );
    expect(container.querySelector('.key-value-label')).toHaveTextContent('Plan');
    expect(container.querySelector('.key-value-value-section')).toHaveTextContent('Enterprise');
    expect(screen.queryByRole('button')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('shows an info button that reveals the tooltip to keyboard users', async () => {
    const { fixture, container } = await render(
      `<ds-key-value label="Owner" infoTooltip="Who approves changes">Ada</ds-key-value>`,
      { imports: [KeyValueComponent] },
    );
    await userEvent.tab();
    await settle(fixture);
    expect(screen.getByRole('button', { name: 'More info about Owner' })).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Who approves changes');
    await expectNoA11yViolations(container);
  });

  it('accepts a custom label', async () => {
    const { container } = await render(
      `<ds-key-value label="Owner"><em dsKeyValueLabel>Custom owner</em>Ada</ds-key-value>`,
      { imports: [KeyValueComponent] },
    );
    expect(container.querySelector('.key-value-label')).toBeNull();
    expect(container.querySelector('.key-value-label-section em')).toHaveTextContent(
      'Custom owner',
    );
    expect(container.querySelector('.key-value-value-section')).toHaveTextContent('Ada');
  });
});
