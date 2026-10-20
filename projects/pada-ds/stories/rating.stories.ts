import type { Meta, StoryObj } from '@storybook/angular';
import { RatingComponent } from 'pada-ds-angular';

const meta: Meta<RatingComponent> = {
  title: 'Forms/Rating',
  component: RatingComponent,
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
  args: {
    label: 'Your rating',
    value: 3,
    max: 5,
    readonly: false,
    disabled: false,
    allowClear: true,
    showLabel: true,
    size: 'md',
  },
  render: (args) => ({
    props: args,
    template: `
      <ds-rating [label]="label" [(value)]="value" [max]="max" [readonly]="readonly" [disabled]="disabled"
                 [allowClear]="allowClear" [showLabel]="showLabel" [size]="size" />`,
  }),
};
export default meta;
type Story = StoryObj<RatingComponent>;

export const Default: Story = {};
export const ReadOnly: Story = { args: { label: 'Average', value: 4.5, readonly: true } };
export const Empty: Story = { args: { value: 0 } };
export const Large: Story = { args: { size: 'lg', max: 10, value: 7 } };
export const Disabled: Story = { args: { disabled: true } };
