import type { Meta, StoryObj } from '@storybook/angular';
import { AspectRatioComponent } from 'pada-ds-angular';
import { landscape } from './sample-images';

const meta: Meta<AspectRatioComponent> = {
  title: 'Layout/AspectRatio',
  component: AspectRatioComponent,
  args: { ratio: 16 / 9 },
  render: (args) => ({
    props: { ...args, cover: landscape(210, 'Team offsite') },
    template: `
      <div style="width: 360px">
        <ds-aspect-ratio [ratio]="ratio"><img [src]="cover" alt="Team offsite" /></ds-aspect-ratio>
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<AspectRatioComponent>;

export const Default: Story = {};
export const Square: Story = { args: { ratio: 1 } };
export const Classic: Story = { args: { ratio: 4 / 3 } };
export const Portrait: Story = { args: { ratio: 3 / 4 } };
