import type { Meta, StoryObj } from '@storybook/angular';
import { PasswordInputComponent } from 'pada-ds-angular';

const meta: Meta<PasswordInputComponent> = {
  title: 'Forms/PasswordInput',
  component: PasswordInputComponent,
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
  args: {
    label: 'Password',
    value: '',
    visible: false,
    strength: false,
    autocomplete: 'current-password',
    size: 'md',
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 320px">
        <ds-password-input [label]="label" [(value)]="value" [(visible)]="visible" [strength]="strength" [autocomplete]="autocomplete"
                           [size]="size" [description]="description" [error]="error" [disabled]="disabled" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<PasswordInputComponent>;

export const Default: Story = {};
export const Visible: Story = { args: { value: 'correct horse', visible: true } };
export const WithStrength: Story = {
  args: {
    label: 'New password',
    autocomplete: 'new-password',
    strength: true,
    value: 'Tr0ub4dor&3',
  },
};
export const Error: Story = { args: { value: 'abc', error: 'Use at least 12 characters.' } };
export const Disabled: Story = { args: { disabled: true } };
