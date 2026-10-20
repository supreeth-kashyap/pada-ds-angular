import type { Meta, StoryObj } from '@storybook/angular';
import { InputTextComponent } from 'pada-ds-angular';

const meta: Meta<InputTextComponent> = {
  title: 'Forms/InputText',
  component: InputTextComponent,
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'tel', 'url', 'number'],
    },
  },
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'ada@example.com',
    value: '',
    required: false,
    optional: false,
    disabled: false,
    readonly: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 320px">
        <ds-input-text [label]="label" [type]="type" [placeholder]="placeholder" [description]="description" [error]="error"
                       [(value)]="value" [required]="required" [optional]="optional" [disabled]="disabled" [readonly]="readonly" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<InputTextComponent>;

export const Default: Story = {};
export const WithDescription: Story = { args: { description: 'We send receipts here.' } };
export const Error: Story = { args: { value: 'ada@', error: 'Enter a valid email address.' } };
export const Required: Story = { args: { required: true } };
export const Disabled: Story = { args: { value: 'ada@example.com', disabled: true } };
export const ReadOnly: Story = { args: { value: 'ada@example.com', readonly: true } };
export const PrefixAndSuffix: Story = {
  args: { label: 'Price', type: 'number', placeholder: '0.00', value: '' },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 320px">
        <ds-input-text [label]="label" [type]="type" [placeholder]="placeholder" [(value)]="value">
          <span dsPrefix>$</span>
          <span dsSuffix>USD</span>
        </ds-input-text>
      </div>`,
  }),
};
