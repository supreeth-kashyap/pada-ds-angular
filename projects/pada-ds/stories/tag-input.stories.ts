import type { Meta, StoryObj } from '@storybook/angular';
import { TagInputComponent } from 'pada-ds-angular';

const isEmail = (tag: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tag) ? null : `${tag} is not an email address`;

const meta: Meta<TagInputComponent> = {
  title: 'Forms/TagInput',
  component: TagInputComponent,
  args: {
    label: 'Keywords',
    value: ['design', 'tokens'],
    placeholder: 'Add a keyword',
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 400px">
        <ds-tag-input [label]="label" [(value)]="value" [placeholder]="placeholder" [description]="description" [error]="error"
                      [maxTags]="maxTags" [validate]="validate" [disabled]="disabled" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<TagInputComponent>;

export const Default: Story = {};
export const Empty: Story = { args: { value: [], description: 'Press Enter or a comma to add.' } };
export const MaxTags: Story = { args: { maxTags: 3, value: ['design', 'tokens', 'motion'] } };
export const Validated: Story = {
  args: {
    label: 'Emails',
    value: ['ada@example.com'],
    placeholder: 'name@example.com',
    validate: isEmail,
  },
};
export const Disabled: Story = { args: { disabled: true } };
