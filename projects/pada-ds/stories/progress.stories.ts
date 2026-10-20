import type { Meta, StoryObj } from '@storybook/angular';
import { ProgressComponent } from 'pada-ds-angular';

const meta: Meta<ProgressComponent> = {
  title: 'Feedback/Progress',
  component: ProgressComponent,
  args: { label: 'Uploading', value: 42, max: 100, showValue: true },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 360px"><ds-progress [label]="label" [value]="value" [max]="max" [showValue]="showValue" /></div>`,
  }),
};
export default meta;
type Story = StoryObj<ProgressComponent>;

export const Determinate: Story = {};
export const Indeterminate: Story = {
  args: { label: 'Preparing export', value: null, showValue: false },
};
export const Complete: Story = { args: { label: 'Uploaded', value: 100 } };
export const WithoutLabel: Story = { args: { label: undefined, showValue: false, value: 64 } };
