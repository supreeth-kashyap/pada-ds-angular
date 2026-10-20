import type { Meta, StoryObj } from '@storybook/angular';
import { PadaLogoComponent } from 'pada-ds-angular';

const meta: Meta<PadaLogoComponent> = {
  title: 'Display/PadaLogo',
  component: PadaLogoComponent,
  argTypes: {
    variant: { control: 'select', options: ['lockup', 'mark', 'wordmark'] },
    tone: { control: 'select', options: ['color', 'accent', 'mono'] },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
  },
  args: { variant: 'lockup', tone: 'color', size: 'lg', animated: false, decorative: false },
  render: (args) => ({
    props: args,
    template: `<ds-pada-logo [variant]="variant" [tone]="tone" [size]="size" [animated]="animated" [decorative]="decorative" />`,
  }),
};
export default meta;
type Story = StoryObj<PadaLogoComponent>;

export const Lockup: Story = {};
export const Mark: Story = { args: { variant: 'mark' } };
export const Wordmark: Story = { args: { variant: 'wordmark' } };
export const Accent: Story = { args: { tone: 'accent' } };
export const Mono: Story = { args: { tone: 'mono' } };
export const Loading: Story = { args: { variant: 'mark', animated: 'loop', size: 'xl' } };
