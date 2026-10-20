import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { StepsComponent } from './steps';

describe('Steps', () => {
  it('is a list; the current step is marked and every step announces its status', async () => {
    const { fixture } = await render(`<ds-steps [steps]="steps" />`, {
      imports: [StepsComponent],
      componentProperties: {
        steps: [
          { title: 'Account', status: 'completed', description: 'Done yesterday' },
          { title: 'Plan', status: 'current' },
          { title: 'Confirm', status: 'upcoming', clickable: false },
        ],
      },
    });
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).toHaveAttribute('data-status', 'completed');
    expect(items[2]).toHaveAttribute('data-last', '');
    const account = screen.getByRole('button', { name: 'Account (completed)' });
    expect(account).toHaveAccessibleDescription('Done yesterday');
    expect(items[1]).toHaveTextContent('Plan (current step)');
    // Not clickable, so not a button.
    expect(screen.queryByRole('button', { name: /Confirm/ })).toBeNull();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('clicking (or pressing Enter on) a step selects it', async () => {
    const onStepChange = vi.fn();
    const { fixture } = await render(
      `<ds-steps [steps]="steps" (currentStepChange)="onStepChange($event)" />`,
      {
        imports: [StepsComponent],
        componentProperties: {
          onStepChange,
          steps: [{ title: 'One', status: 'completed' }, { title: 'Two' }],
        },
      },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Two (not started)' }));
    await settle(fixture);
    expect(onStepChange).toHaveBeenLastCalledWith(2);
    expect(screen.getAllByRole('listitem')[1]).toHaveAttribute('aria-current', 'step');
    screen.getByRole('button', { name: 'One (completed)' }).focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(onStepChange).toHaveBeenLastCalledWith(1);
  });

  it('follows a bound current step, uses step values and names untitled steps', async () => {
    const stepClick = vi.fn();
    await render(`<ds-steps [steps]="steps" currentStep="b" (stepClick)="stepClick($event)" />`, {
      imports: [StepsComponent],
      componentProperties: {
        stepClick,
        steps: [{ stepValue: 'a', status: 'completed' }, { stepValue: 'b' }, { stepValue: 'c' }],
      },
    });
    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[1]).toHaveTextContent('Step b (current step)');
    expect(items[2]).toHaveAttribute('data-status', 'upcoming');
    await userEvent.click(screen.getByRole('button', { name: 'Step c (not started)' }));
    expect(stepClick).toHaveBeenCalledWith('c');
  });
});
