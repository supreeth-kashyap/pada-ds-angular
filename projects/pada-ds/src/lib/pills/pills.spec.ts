import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { PillOption, PillsComponent } from './pills';

const OPTIONS: PillOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month', disabled: true },
  { value: 'year', label: 'Year' },
];

describe('PillsComponent', () => {
  it('is a named tab list that selects the first option by default', async () => {
    const { container } = await render(`<ds-pills label="Period" [options]="options" />`, {
      imports: [PillsComponent],
      componentProperties: { options: OPTIONS },
    });
    expect(screen.getByRole('tablist', { name: 'Period' })).toHaveAttribute('data-size', 'md');
    const day = screen.getByRole('tab', { name: 'Day' });
    expect(day).toHaveAttribute('aria-selected', 'true');
    expect(day).toHaveAttribute('tabindex', '0');
    expect(day).toHaveAttribute('type', 'button');
    expect(screen.getByRole('tab', { name: 'Week' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tab', { name: 'Month' })).toBeDisabled();
    await expectNoA11yViolations(container);
  });

  it('selects on click and two-way binds the value', async () => {
    const { fixture } = await render(`<ds-pills [options]="options" [(value)]="value" />`, {
      imports: [PillsComponent],
      componentProperties: { options: OPTIONS, value: 'week' },
    });
    expect(screen.getByRole('tab', { name: 'Week' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('tab', { name: 'Year' }));
    await settle(fixture);
    expect((fixture.componentInstance as unknown as { value: string }).value).toBe('year');
    expect(screen.getByRole('tab', { name: 'Year' })).toHaveAttribute('aria-selected', 'true');
  });

  it('moves and selects with arrow keys, skipping disabled pills and wrapping', async () => {
    const { fixture } = await render(`<ds-pills [options]="options" [(value)]="value" />`, {
      imports: [PillsComponent],
      componentProperties: { options: OPTIONS, value: 'week' },
    });
    const value = () => (fixture.componentInstance as unknown as { value: string }).value;
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Week' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    expect(value()).toBe('year');
    expect(screen.getByRole('tab', { name: 'Year' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    expect(value()).toBe('day');
    await userEvent.keyboard('{ArrowLeft}');
    await settle(fixture);
    expect(value()).toBe('year');
    await userEvent.keyboard('{Home}');
    await settle(fixture);
    expect(value()).toBe('day');
    await userEvent.keyboard('{End}');
    await settle(fixture);
    expect(value()).toBe('year');
    expect(screen.getByRole('tab', { name: 'Year' })).toHaveFocus();
  });

  it('disables every pill', async () => {
    await render(`<ds-pills [options]="options" disabled size="sm" />`, {
      imports: [PillsComponent],
      componentProperties: { options: OPTIONS },
    });
    expect(screen.getByRole('tablist')).toHaveAttribute('data-disabled', '');
    for (const tab of screen.getAllByRole('tab')) expect(tab).toBeDisabled();
  });
});
