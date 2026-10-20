import type { Meta, StoryObj } from '@storybook/angular';
import { SpinnerComponent } from 'pada-ds-angular';

const meta: Meta<SpinnerComponent> = {
  title: 'Feedback/Spinner',
  component: SpinnerComponent,
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
  args: { size: 'md', label: 'Loading' },
  render: (args) => ({ props: args, template: `<ds-spinner [size]="size" [label]="label" />` }),
};
export default meta;
type Story = StoryObj<SpinnerComponent>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm', label: 'Saving' } };
export const Large: Story = { args: { size: 'lg' } };
