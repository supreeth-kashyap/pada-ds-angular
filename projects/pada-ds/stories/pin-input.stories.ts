import type { Meta, StoryObj } from '@storybook/angular';
import { PinInputComponent } from 'pada-ds-angular';

const meta: Meta<PinInputComponent> = {
  title: 'Forms/PinInput',
  component: PinInputComponent,
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    type: { control: 'select', options: ['numeric', 'alphanumeric'] },
  },
  args: {
    label: 'Verification code',
    length: 6,
    groupSize: 3,
    value: '',
    type: 'numeric',
    mask: false,
    size: 'md',
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <ds-pin-input [label]="label" [length]="length" [groupSize]="groupSize" [(value)]="value" [type]="type" [mask]="mask"
                    [size]="size" [description]="description" [error]="error" [disabled]="disabled" />`,
  }),
};
export default meta;
type Story = StoryObj<PinInputComponent>;

export const Default: Story = {};
export const Filled: Story = { args: { value: '482913' } };
export const Masked: Story = {
  args: { label: 'PIN', length: 4, groupSize: undefined, mask: true, value: '12' },
};
export const Alphanumeric: Story = {
  args: { label: 'Invite code', type: 'alphanumeric', length: 8, groupSize: 4 },
};
export const Error: Story = { args: { value: '111111', error: 'That code has expired.' } };
export const Disabled: Story = { args: { disabled: true } };
