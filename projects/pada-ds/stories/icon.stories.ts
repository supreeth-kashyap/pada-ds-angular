import type { Meta, StoryObj } from '@storybook/angular';
import { IconComponent } from 'pada-ds-angular';

const meta: Meta<IconComponent> = {
  title: 'Display/Icon',
  component: IconComponent,
  argTypes: {
    name: {
      control: 'select',
      options: ['tick_1', 'alert_1', 'search', 'bell', 'calendar_3', 'team', 'folder', 'lock'],
    },
    variant: { control: 'select', options: ['stroke', 'fill'] },
  },
  args: { name: 'tick_1', size: 24 },
  render: (args) => ({
    props: args,
    template: `<ds-icon [name]="name" [size]="size" [color]="color" [label]="label" />`,
  }),
};
export default meta;
type Story = StoryObj<IconComponent>;

export const Default: Story = {};
export const Coloured: Story = { args: { name: 'tick_2', color: 'var(--pada-color-success-fg)' } };
export const Labelled: Story = { args: { name: 'alert_1', label: 'Warning' } };
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center">
        <ds-icon name="bell" [size]="16" />
        <ds-icon name="bell" [size]="20" />
        <ds-icon name="bell" [size]="32" />
        <ds-icon name="bell" size="3rem" />
      </div>`,
  }),
};
