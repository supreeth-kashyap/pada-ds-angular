import type { Meta, StoryObj } from '@storybook/angular';
import { BrandLogoComponent } from 'pada-ds-angular';
import { brandMark } from './sample-images';

/**
 * The library does not bundle third-party logo images (they come from your copy of Pada's logo
 * library), so these stories pass inline images through `src`.
 */
const meta: Meta<BrandLogoComponent> = {
  title: 'Display/BrandLogo',
  component: BrandLogoComponent,
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
    background: { control: 'boolean' },
  },
  args: { name: 'acme', src: brandMark(220, 'A'), size: 'lg', background: false },
  render: (args) => ({
    props: args,
    template: `<ds-brand-logo [name]="name" [src]="src" [size]="size" [background]="background" [tooltip]="tooltip" />`,
  }),
};
export default meta;
type Story = StoryObj<BrandLogoComponent>;

export const Default: Story = {};
export const WithBackground: Story = { args: { background: true } };
export const WithTooltip: Story = {
  args: { name: 'globex', src: brandMark(10, 'G'), tooltip: 'Connected' },
};
export const Sizes: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; gap: 12px; align-items: center">
        @for (size of ['xs', 'sm', 'md', 'lg', 'xl', '2xl']; track size) {
          <ds-brand-logo [name]="name" [src]="src" [size]="size" />
        }
      </div>`,
  }),
};
