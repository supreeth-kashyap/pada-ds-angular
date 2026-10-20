import type { Meta, StoryObj } from '@storybook/angular';
import { IconButtonComponent } from 'pada-ds-angular';

const meta: Meta<IconButtonComponent> = {
  title: 'Actions/IconButton',
  component: IconButtonComponent,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'destructive'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: {
    icon: 'edit_1',
    label: 'Rename',
    variant: 'ghost',
    size: 'md',
    loading: false,
    tooltip: false,
  },
  render: (args) => ({
    props: args,
    template: `<button dsIconButton [icon]="icon" [label]="label" [variant]="variant" [size]="size" [loading]="loading" [tooltip]="tooltip"></button>`,
  }),
};
export default meta;
type Story = StoryObj<IconButtonComponent>;

export const Ghost: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Primary: Story = { args: { variant: 'primary', icon: 'add', label: 'Add' } };
export const Destructive: Story = {
  args: { variant: 'destructive', icon: 'delete', label: 'Delete' },
};
export const Loading: Story = { args: { loading: true } };
