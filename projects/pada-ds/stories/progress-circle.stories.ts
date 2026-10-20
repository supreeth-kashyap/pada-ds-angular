import type { Meta, StoryObj } from '@storybook/angular';
import { ProgressCircleComponent } from 'pada-ds-angular';

const meta: Meta<ProgressCircleComponent> = {
  title: 'Feedback/ProgressCircle',
  component: ProgressCircleComponent,
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
  args: { label: 'Uploading report.pdf', value: 64, max: 100, size: 'md', showValue: false },
  render: (args) => ({
    props: args,
    template: `<ds-progress-circle [label]="label" [value]="value" [max]="max" [size]="size" [showValue]="showValue" />`,
  }),
};
export default meta;
type Story = StoryObj<ProgressCircleComponent>;

export const Default: Story = {};
export const Indeterminate: Story = { args: { label: 'Syncing', value: null, size: 'sm' } };
export const WithValue: Story = {
  args: { label: 'Storage used', value: 72, size: 'lg', showValue: true },
};
export const Complete: Story = { args: { label: 'Uploaded', value: 100 } };
