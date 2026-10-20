import type { Meta, StoryObj } from '@storybook/angular';
import { SkeletonComponent } from 'pada-ds-angular';

const meta: Meta<SkeletonComponent> = {
  title: 'Feedback/Skeleton',
  component: SkeletonComponent,
  argTypes: { shape: { control: 'select', options: ['text', 'rect', 'circle'] } },
  args: { shape: 'text', lines: 1, width: 240 },
  render: (args) => ({
    props: args,
    template: `<div aria-busy="true"><ds-skeleton [shape]="shape" [lines]="lines" [width]="width" [height]="height" /></div>`,
  }),
};
export default meta;
type Story = StoryObj<SkeletonComponent>;

export const Text: Story = {};
export const Paragraph: Story = { args: { lines: 3, width: 360 } };
export const Rect: Story = { args: { shape: 'rect', width: 320, height: 180 } };
export const Circle: Story = { args: { shape: 'circle', width: 40 } };
export const ProfileCard: Story = {
  render: () => ({
    template: `
      <section aria-busy="true" style="display: flex; gap: 12px; align-items: flex-start; max-width: 360px">
        <ds-skeleton shape="circle" [width]="40" />
        <div style="flex: 1"><ds-skeleton [lines]="3" /></div>
      </section>`,
  }),
};
