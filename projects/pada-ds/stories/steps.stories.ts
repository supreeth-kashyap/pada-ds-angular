import type { Meta, StoryObj } from '@storybook/angular';
import { StepsComponent, type StepData } from 'pada-ds-angular';

const checkout: StepData[] = [
  { stepValue: 'cart', title: 'Cart', description: 'Review the items in your order' },
  { stepValue: 'shipping', title: 'Shipping', description: 'Where should we send it?' },
  { stepValue: 'payment', title: 'Payment', description: 'Card, UPI or net banking' },
  { stepValue: 'confirm', title: 'Confirm', description: 'Check everything and place the order' },
];

const meta: Meta<StepsComponent> = {
  title: 'Navigation/Steps',
  component: StepsComponent,
  argTypes: {
    defaultStatus: { control: 'select', options: ['upcoming', 'current', 'completed'] },
  },
  args: { steps: checkout, currentStep: 'shipping', defaultStatus: 'upcoming' },
  render: (args) => ({
    props: args,
    template: `<ds-steps [steps]="steps" [defaultStatus]="defaultStatus" [(currentStep)]="currentStep" />`,
  }),
};
export default meta;
type Story = StoryObj<StepsComponent>;

export const Default: Story = {};
export const FirstStep: Story = { args: { currentStep: 'cart' } };
export const LastStep: Story = { args: { currentStep: 'confirm' } };
export const OwnStatuses: Story = {
  args: {
    currentStep: undefined,
    steps: [
      { title: 'Create workspace', status: 'completed' },
      { title: 'Invite your team', status: 'completed' },
      { title: 'Connect a data source', status: 'current', description: 'Postgres, BigQuery or a CSV' },
      { title: 'Build the first report', status: 'upcoming' },
    ],
  },
};
export const TitlesOnly: Story = {
  args: {
    steps: [
      { stepValue: 1, title: 'Account' },
      { stepValue: 2, title: 'Profile' },
      { stepValue: 3, title: 'Done' },
    ],
    currentStep: 2,
  },
};
