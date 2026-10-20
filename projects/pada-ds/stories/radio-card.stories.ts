import type { Meta, StoryObj } from '@storybook/angular';
import { RadioCardGroupComponent, type RadioCardOption } from 'pada-ds-angular';

const plans: RadioCardOption[] = [
  {
    value: 'starter',
    title: 'Starter',
    description: 'For individuals and small projects.',
    icon: 'user_default',
    meta: '$0 / month',
  },
  {
    value: 'team',
    title: 'Team',
    description: 'Shared workspaces and roles.',
    icon: 'team',
    meta: '$12 / seat',
  },
  {
    value: 'business',
    title: 'Business',
    description: 'SSO, audit logs and priority support.',
    icon: 'corporate',
    meta: '$24 / seat',
  },
];

const meta: Meta<RadioCardGroupComponent> = {
  title: 'Forms/RadioCardGroup',
  component: RadioCardGroupComponent,
  args: { label: 'Plan', options: plans, value: 'team', columns: 3, disabled: false },
  render: (args) => ({
    props: args,
    template: `<ds-radio-card-group [label]="label" [options]="options" [(value)]="value" [columns]="columns" [description]="description" [disabled]="disabled" />`,
  }),
};
export default meta;
type Story = StoryObj<RadioCardGroupComponent>;

export const Default: Story = {};
export const SingleColumn: Story = {
  args: { columns: 1, description: 'You can change plans at any time.' },
};
export const WithDisabledCard: Story = {
  args: {
    options: [
      ...plans,
      {
        value: 'enterprise',
        title: 'Enterprise',
        description: 'Talk to sales.',
        icon: 'lock',
        disabled: true,
      },
    ],
    columns: 2,
  },
};
export const Disabled: Story = { args: { disabled: true } };
