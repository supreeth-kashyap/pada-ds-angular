import { render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { StatComponent } from './stat';

describe('StatComponent', () => {
  it('formats the value and delta and names the trend', async () => {
    const { container } = await render(
      `<ds-stat
         label="Revenue"
         [value]="128400"
         locale="en-US"
         [formatOptions]="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
         [delta]="0.124"
         [deltaFormatOptions]="{ style: 'percent', maximumFractionDigits: 1 }"
         deltaLabel="vs last month"
       />`,
      { imports: [StatComponent] },
    );
    const group = screen.getByRole('group', { name: 'Revenue' });
    expect(group).toHaveTextContent('$128,400');
    expect(group).toHaveAttribute('data-size', 'md');
    const delta = group.querySelector('.stat-delta')!;
    expect(delta).toHaveAttribute('data-sentiment', 'positive');
    expect(delta).toHaveAttribute('data-trend', 'up');
    expect(delta.querySelector('.stat-delta-badge')).toHaveTextContent('up +12.4%');
    expect(delta).toHaveTextContent('vs last month');
    await expectNoA11yViolations(container);
  });

  it('treats a fall as good when the trend is inverted', async () => {
    const { container } = await render(
      `<ds-stat label="Errors" [value]="12" [delta]="-5" invertTrend />`,
      { imports: [StatComponent] },
    );
    const delta = container.querySelector('.stat-delta')!;
    expect(delta).toHaveAttribute('data-sentiment', 'positive');
    expect(delta).toHaveAttribute('data-trend', 'down');
    expect(delta).toHaveTextContent('down -5');
  });

  it('honours an explicit trend and shows unchanged deltas as neutral', async () => {
    const { container } = await render(
      `<ds-stat label="Seats" [value]="40" [delta]="0" />
       <ds-stat label="Churn" [value]="3" [delta]="2" trend="down" />`,
      { imports: [StatComponent] },
    );
    const [seats, churn] = Array.from(container.querySelectorAll('.stat-delta'));
    expect(seats).toHaveAttribute('data-sentiment', 'neutral');
    expect(seats).toHaveTextContent('unchanged 0');
    expect(churn).toHaveAttribute('data-trend', 'down');
    expect(churn).toHaveAttribute('data-sentiment', 'negative');
  });

  it('renders text values, a description and a projected chart, without a delta', async () => {
    const { container } = await render(
      `<ds-stat label="Status" value="Healthy" description="All systems go" size="sm">
         <svg dsStatChart data-testid="chart"></svg>
       </ds-stat>`,
      { imports: [StatComponent] },
    );
    const group = screen.getByRole('group', { name: 'Status' });
    expect(group.querySelector('.stat-value')).toHaveTextContent('Healthy');
    expect(group.querySelector('.stat-description')).toHaveTextContent('All systems go');
    expect(group.querySelector('.stat-chart')).toContainElement(screen.getByTestId('chart'));
    expect(group.querySelector('.stat-delta')).toBeNull();
    expect(group).toHaveAttribute('data-size', 'sm');
    await expectNoA11yViolations(container);
  });

  it('announces the new value at once when it changes', async () => {
    const { fixture, rerender } = await render(
      `<ds-stat label="Users" [value]="value" locale="en-US" />`,
      { imports: [StatComponent], componentProperties: { value: 10 } },
    );
    await rerender({ componentProperties: { value: 2000 } });
    await settle(fixture);
    const hidden = screen.getByRole('group', { name: 'Users' }).querySelector('[dsVisuallyHidden]');
    expect(hidden).toHaveTextContent('2,000');
  });
});
