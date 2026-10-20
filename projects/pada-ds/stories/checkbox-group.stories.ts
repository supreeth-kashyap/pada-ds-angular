import type { Meta, StoryObj } from '@storybook/angular';
import { CheckboxGroupComponent, type CheckboxGroupOption } from 'pada-ds-angular';

const topics: CheckboxGroupOption[] = [
  { value: 'mentions', label: 'Mentions' },
  { value: 'comments', label: 'Comments on my documents' },
  { value: 'reviews', label: 'Review requests' },
  { value: 'digest', label: 'Weekly digest' },
];

const meta: Meta<CheckboxGroupComponent> = {
  title: 'Forms/CheckboxGroup',
  component: CheckboxGroupComponent,
  argTypes: { orientation: { control: 'select', options: ['vertical', 'horizontal'] } },
  args: {
    label: 'Notify me about',
    description: 'We send at most one email a day.',
    options: topics,
    value: ['mentions'],
    selectAll: false,
    orientation: 'vertical',
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <ds-checkbox-group [label]="label" [description]="description" [error]="error" [options]="options" [(value)]="value"
                         [selectAll]="selectAll" [orientation]="orientation" [disabled]="disabled" />`,
  }),
};
export default meta;
type Story = StoryObj<CheckboxGroupComponent>;

export const Default: Story = {};
export const SelectAll: Story = { args: { selectAll: true, value: ['mentions', 'reviews'] } };
export const Horizontal: Story = { args: { orientation: 'horizontal', description: undefined } };
export const Error: Story = { args: { value: [], error: 'Pick at least one topic.' } };
export const Disabled: Story = { args: { disabled: true } };
