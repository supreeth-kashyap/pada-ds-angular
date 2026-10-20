import type { Meta, StoryObj } from '@storybook/angular';
import { BadgeComponent } from 'pada-ds-angular';

const meta: Meta<BadgeComponent> = {
  title: 'Display/Badge',
  component: BadgeComponent,
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'accent', 'success', 'warning', 'danger', 'info'] },
    variant: { control: 'select', options: ['subtle', 'solid', 'outline'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
  args: { tone: 'neutral', variant: 'subtle', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<ds-badge [tone]="tone" [variant]="variant" [size]="size">Active</ds-badge>`,
  }),
};
export default meta;
type Story = StoryObj<BadgeComponent>;

export const Default: Story = {};
export const Success: Story = { args: { tone: 'success' } };
export const SolidDanger: Story = { args: { tone: 'danger', variant: 'solid' } };
