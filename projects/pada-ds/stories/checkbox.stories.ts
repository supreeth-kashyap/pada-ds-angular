import type { Meta, StoryObj } from '@storybook/angular';
import { CheckboxComponent } from 'pada-ds-angular';

const meta: Meta<CheckboxComponent> = {
  title: 'Forms/Checkbox',
  component: CheckboxComponent,
  args: { label: 'Email me product updates', checked: false, indeterminate: false, disabled: false },
  render: (args) => ({
    props: args,
    template: `<ds-checkbox [label]="label" [(checked)]="checked" [indeterminate]="indeterminate" [disabled]="disabled" />`,
  }),
};
export default meta;
type Story = StoryObj<CheckboxComponent>;

export const Default: Story = {};
export const Checked: Story = { args: { checked: true } };
export const Indeterminate: Story = { args: { indeterminate: true } };
export const Disabled: Story = { args: { disabled: true } };
