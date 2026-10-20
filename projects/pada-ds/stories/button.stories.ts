import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent } from 'pada-ds-angular';

const meta: Meta<ButtonComponent> = {
  title: 'Actions/Button',
  component: ButtonComponent,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'destructive'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: { variant: 'primary', size: 'md', loading: false },
  render: (args) => ({
    props: args,
    template: `<button dsButton [variant]="variant" [size]="size" [loading]="loading">Save changes</button>`,
  }),
};
export default meta;
type Story = StoryObj<ButtonComponent>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Destructive: Story = { args: { variant: 'destructive' } };
export const Loading: Story = { args: { loading: true } };
