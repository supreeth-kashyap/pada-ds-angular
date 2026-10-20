import type { Meta, StoryObj } from '@storybook/angular';
import { InputTextAreaComponent } from 'pada-ds-angular';

const meta: Meta<InputTextAreaComponent> = {
  title: 'Forms/InputTextArea',
  component: InputTextAreaComponent,
  args: {
    label: 'Notes',
    description: 'Visible to your team.',
    value: '',
    rows: 4,
    required: false,
    optional: false,
    disabled: false,
    readonly: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 400px">
        <ds-input-text-area [label]="label" [description]="description" [error]="error" [placeholder]="placeholder" [(value)]="value"
                            [rows]="rows" [maxLength]="maxLength" [required]="required" [optional]="optional"
                            [disabled]="disabled" [readonly]="readonly" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<InputTextAreaComponent>;

export const Default: Story = {};
export const MaxLength: Story = { args: { maxLength: 140, value: 'Kick-off moved to Thursday.' } };
export const Error: Story = { args: { error: 'Add a note before submitting.', required: true } };
export const Disabled: Story = { args: { value: 'Locked by the admin.', disabled: true } };
