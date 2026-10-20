import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { FieldComponent, FieldParts } from 'pada-ds-angular';

type FieldArgs = FieldComponent & {
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  optional: boolean;
};

const meta: Meta<FieldArgs> = {
  title: 'Forms/Field',
  component: FieldComponent,
  decorators: [moduleMetadata({ imports: [...FieldParts] })],
  args: { invalid: false, required: false, disabled: false, optional: false },
  render: (args) => ({
    props: args,
    template: `
      <ds-field style="max-width: 320px" [invalid]="invalid" [required]="required" [disabled]="disabled">
        <ds-field-label [optional]="optional">Email</ds-field-label>
        <input dsInput dsFieldControl type="email" placeholder="ada@example.com" />
        <ds-field-description>We never share it.</ds-field-description>
        <ds-field-error>Enter a valid email address.</ds-field-error>
      </ds-field>`,
  }),
};
export default meta;
type Story = StoryObj<FieldArgs>;

export const Default: Story = {};
export const Required: Story = { args: { required: true } };
export const Optional: Story = { args: { optional: true } };
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Textarea: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ds-field style="max-width: 320px" [invalid]="invalid" [required]="required" [disabled]="disabled">
        <ds-field-label>Bio</ds-field-label>
        <textarea dsInput dsFieldControl rows="4"></textarea>
        <ds-field-description>A sentence or two about you.</ds-field-description>
      </ds-field>`,
  }),
};
