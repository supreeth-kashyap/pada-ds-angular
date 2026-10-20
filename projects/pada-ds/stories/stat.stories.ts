import type { Meta, StoryObj } from '@storybook/angular';
import { StatComponent } from 'pada-ds-angular';

const meta: Meta<StatComponent> = {
  title: 'Display/Stat',
  component: StatComponent,
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    trend: { control: 'select', options: [undefined, 'up', 'down', 'neutral'] },
  },
  args: {
    label: 'Revenue',
    value: 128400,
    formatOptions: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    locale: 'en-US',
    delta: 0.124,
    deltaFormatOptions: { style: 'percent', maximumFractionDigits: 1 },
    deltaLabel: 'vs last month',
    invertTrend: false,
    size: 'md',
  },
  render: (args) => ({
    props: args,
    template: `
      <ds-stat [label]="label" [value]="value" [formatOptions]="formatOptions" [locale]="locale"
               [delta]="delta" [deltaFormatOptions]="deltaFormatOptions" [deltaLabel]="deltaLabel"
               [trend]="trend" [invertTrend]="invertTrend" [description]="description" [size]="size" />`,
  }),
};
export default meta;
type Story = StoryObj<StatComponent>;

export const Default: Story = {};
export const Negative: Story = {
  args: { label: 'Active users', value: 8214, formatOptions: undefined, delta: -0.032 },
};
export const InvertedTrend: Story = {
  args: {
    label: 'Churn',
    value: 0.021,
    formatOptions: { style: 'percent', maximumFractionDigits: 1 },
    delta: -0.004,
    invertTrend: true,
  },
};
export const WithDescription: Story = {
  args: { description: 'Recognised revenue, net of refunds.', size: 'lg' },
};
export const WithChart: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ds-stat [label]="label" [value]="value" [formatOptions]="formatOptions" [locale]="locale"
               [delta]="delta" [deltaFormatOptions]="deltaFormatOptions" [deltaLabel]="deltaLabel">
        <svg dsStatChart viewBox="0 0 120 32" width="120" height="32" aria-hidden="true">
          <polyline fill="none" stroke="currentColor" stroke-width="2" points="0,26 20,22 40,24 60,14 80,16 100,8 120,4" />
        </svg>
      </ds-stat>`,
  }),
};
