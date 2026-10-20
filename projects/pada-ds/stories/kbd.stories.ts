import type { Meta, StoryObj } from '@storybook/angular';
import { KbdComponent } from 'pada-ds-angular';

const meta: Meta<KbdComponent> = {
  title: 'Display/Kbd',
  component: KbdComponent,
  render: () => ({ template: `<kbd dsKbd>Esc</kbd>` }),
};
export default meta;
type Story = StoryObj<KbdComponent>;

export const SingleKey: Story = {};
export const Shortcut: Story = {
  args: { keys: ['⌘', 'K'] },
  render: (args) => ({ props: args, template: `<kbd dsKbd [keys]="keys"></kbd>` }),
};
export const InText: Story = {
  render: () => ({
    template: `<p>Press <kbd dsKbd [keys]="['Ctrl', 'K']"></kbd> to open the command palette.</p>`,
  }),
};
