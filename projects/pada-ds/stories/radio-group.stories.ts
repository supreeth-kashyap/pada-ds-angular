import type { Meta, StoryObj } from '@storybook/angular';
import { RadioGroupComponent, type RadioGroupOption } from 'pada-ds-angular';

const plans: RadioGroupOption[] = [
  { value: 'free', label: 'Free' },
  { value: 'team', label: 'Team' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise (contact sales)', disabled: true },
];

const meta: Meta<RadioGroupComponent> = {
  title: 'Forms/RadioGroup',
  component: RadioGroupComponent,
  args: { label: 'Plan', options: plans, value: 'team', disabled: false, required: false },
  render: (args) => ({
    props: args,
    template: `<ds-radio-group [label]="label" [options]="options" [(value)]="value" [disabled]="disabled" [required]="required" />`,
  }),
};
export default meta;
type Story = StoryObj<RadioGroupComponent>;

export const Default: Story = {};
export const NothingChosen: Story = { args: { value: null, required: true } };
export const Disabled: Story = { args: { disabled: true } };
