import type { Meta, StoryObj } from '@storybook/angular';
import { TextComponent } from 'pada-ds-angular';

const sizes = [
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  '9xl',
];

const meta: Meta<TextComponent> = {
  title: 'Display/Text',
  component: TextComponent,
  argTypes: {
    size: { control: 'select', options: sizes },
    weight: {
      control: 'select',
      options: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
    },
    family: { control: 'select', options: [undefined, 'sans', 'serif', 'mono'] },
    lineHeight: { control: 'select', options: ['xs', 'sm', 'base', 'lg', 'xl'] },
  },
  args: { size: 'base', weight: '400', lineHeight: 'base', color: 'var(--pada-color-fg)' },
  render: (args) => ({
    props: args,
    template: `<p dsText [size]="size" [weight]="weight" [family]="family" [lineHeight]="lineHeight" [color]="color">Invoices are sent on the first of each month.</p>`,
  }),
};
export default meta;
type Story = StoryObj<TextComponent>;

export const Default: Story = {};
export const Muted: Story = { args: { size: 'sm', color: 'var(--pada-color-fg-muted)' } };
export const Bold: Story = { args: { size: 'xl', weight: '700' } };
export const Mono: Story = { args: { family: 'mono' } };
export const Scale: Story = {
  render: () => ({
    props: { sizes },
    template: `
      @for (size of sizes; track size) {
        <p dsText [size]="size" style="margin: 0 0 4px">{{ size }}: The quick brown fox</p>
      }`,
  }),
};
