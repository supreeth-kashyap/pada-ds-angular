import type { Meta, StoryObj } from '@storybook/angular';
import { ContainerComponent } from 'pada-ds-angular';

const meta: Meta<ContainerComponent> = {
  title: 'Layout/Container',
  component: ContainerComponent,
  parameters: { layout: 'fullscreen' },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg', 'xl', '2xl', 'full'] } },
  args: { size: 'xl' },
  render: (args) => ({
    props: args,
    template: `
      <ds-container [size]="size">
        <div style="padding: 24px; border: 1px dashed var(--pada-color-border)">
          <h2 style="margin-top: 0">Release notes</h2>
          <p>The container centres page content at a readable maximum width, with gutters that grow on wider screens.</p>
        </div>
      </ds-container>`,
  }),
};
export default meta;
type Story = StoryObj<ContainerComponent>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Medium: Story = { args: { size: 'md' } };
export const Full: Story = { args: { size: 'full' } };
