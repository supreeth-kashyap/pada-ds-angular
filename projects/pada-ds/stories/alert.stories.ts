import type { Meta, StoryObj } from '@storybook/angular';
import { AlertComponent } from 'pada-ds-angular';

const meta: Meta<AlertComponent> = {
  title: 'Feedback/Alert',
  component: AlertComponent,
  argTypes: { tone: { control: 'select', options: ['neutral', 'info', 'success', 'warning', 'danger'] } },
  args: { tone: 'info', title: 'Update available', dismissible: false },
  render: (args) => ({
    props: args,
    template: `<ds-alert [tone]="tone" [title]="title" [dismissible]="dismissible">A new version is ready to install.</ds-alert>`,
  }),
};
export default meta;
type Story = StoryObj<AlertComponent>;

export const Info: Story = {};
export const Success: Story = { args: { tone: 'success', title: 'Saved' } };
export const Danger: Story = { args: { tone: 'danger', title: 'Payment failed', dismissible: true } };
