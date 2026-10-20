import type { Meta, StoryObj } from '@storybook/angular';
import { PillsComponent, type PillOption } from 'pada-ds-angular';

const periods: PillOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const meta: Meta<PillsComponent> = {
  title: 'Navigation/Pills',
  component: PillsComponent,
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
  args: { options: periods, value: 'week', size: 'md', disabled: false, label: 'Period' },
  render: (args) => ({
    props: args,
    template: `<ds-pills [label]="label" [options]="options" [(value)]="value" [size]="size" [disabled]="disabled" />`,
  }),
};
export default meta;
type Story = StoryObj<PillsComponent>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'lg' } };
export const DisabledOption: Story = {
  args: { options: [...periods.slice(0, 3), { value: 'year', label: 'Year', disabled: true }] },
};
export const Disabled: Story = { args: { disabled: true } };
