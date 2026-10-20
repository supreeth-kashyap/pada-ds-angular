import type { Meta, StoryObj } from '@storybook/angular';
import { SwitchComponent } from 'pada-ds-angular';

const meta: Meta<SwitchComponent> = {
  title: 'Forms/Switch',
  component: SwitchComponent,
  args: { label: 'Dark mode', checked: false, disabled: false, loading: false },
  render: (args) => ({
    props: args,
    template: `<ds-switch [label]="label" [(checked)]="checked" [disabled]="disabled" [loading]="loading" />`,
  }),
};
export default meta;
type Story = StoryObj<SwitchComponent>;

export const Off: Story = {};
export const On: Story = { args: { checked: true } };
export const Disabled: Story = { args: { disabled: true } };
