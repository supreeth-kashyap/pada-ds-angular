import type { Meta, StoryObj } from '@storybook/angular';
import { SelectComponent, type SelectOption } from 'pada-ds-angular';

const plans: SelectOption[] = [
  { value: 'free', label: 'Free' },
  { value: 'team', label: 'Team' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise', disabled: true },
];

const regions: SelectOption[] = [
  { value: 'us-east-1', label: 'N. Virginia', group: 'Americas' },
  { value: 'sa-east-1', label: 'São Paulo', group: 'Americas' },
  { value: 'eu-west-1', label: 'Ireland', group: 'Europe' },
  { value: 'eu-central-1', label: 'Frankfurt', group: 'Europe' },
  { value: 'ap-south-1', label: 'Mumbai', group: 'Asia Pacific' },
  { value: 'ap-southeast-2', label: 'Sydney', group: 'Asia Pacific' },
];

const meta: Meta<SelectComponent> = {
  title: 'Forms/Select',
  component: SelectComponent,
  args: {
    label: 'Plan',
    options: plans,
    value: null,
    placeholder: 'Select an option',
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 280px">
        <ds-select [label]="label" [options]="options" [(value)]="value" [placeholder]="placeholder"
                   [description]="description" [error]="error" [disabled]="disabled" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<SelectComponent>;

export const Default: Story = {};
export const Selected: Story = { args: { value: 'team' } };
export const Grouped: Story = {
  args: {
    label: 'Region',
    options: regions,
    value: 'eu-west-1',
    description: 'Where your data is stored.',
  },
};
export const Error: Story = { args: { error: 'Pick a plan to continue.' } };
export const Disabled: Story = { args: { value: 'free', disabled: true } };
