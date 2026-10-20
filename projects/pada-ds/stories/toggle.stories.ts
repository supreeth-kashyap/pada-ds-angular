import type { Meta, StoryObj } from '@storybook/angular';
import { ToggleComponent } from 'pada-ds-angular';

type ToggleArgs = ToggleComponent & { pressed: boolean; disabled: boolean };

const meta: Meta<ToggleArgs> = {
  title: 'Actions/Toggle',
  component: ToggleComponent,
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
  args: { size: 'md', pressed: false, disabled: false },
  render: (args) => ({
    props: args,
    template: `<button dsToggle [size]="size" [(pressed)]="pressed" [disabled]="disabled">Show archived</button>`,
  }),
};
export default meta;
type Story = StoryObj<ToggleArgs>;

export const Default: Story = {};
export const Pressed: Story = { args: { pressed: true } };
export const Disabled: Story = { args: { disabled: true } };
export const IconOnly: Story = {
  render: (args) => ({
    props: args,
    template: `<button dsToggle icon="star" [size]="size" [(pressed)]="pressed" [disabled]="disabled" aria-label="Favourite"></button>`,
  }),
};
