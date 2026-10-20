import type { Meta, StoryObj } from '@storybook/angular';
import { HeadingComponent } from 'pada-ds-angular';

const meta: Meta<HeadingComponent> = {
  title: 'Display/Heading',
  component: HeadingComponent,
  argTypes: {
    size: {
      control: 'select',
      options: [undefined, 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'],
    },
    weight: { control: 'select', options: ['400', '500', '600', '700', '800'] },
  },
  args: { weight: '600' },
  render: (args) => ({
    props: args,
    template: `<h2 dsHeading [size]="size" [weight]="weight">Billing</h2>`,
  }),
};
export default meta;
type Story = StoryObj<HeadingComponent>;

export const Default: Story = {};
export const CustomSize: Story = { args: { size: 'lg' } };
export const Levels: Story = {
  render: () => ({
    template: `
      <h1 dsHeading>Heading 1</h1>
      <h2 dsHeading>Heading 2</h2>
      <h3 dsHeading>Heading 3</h3>
      <h4 dsHeading>Heading 4</h4>
      <h5 dsHeading>Heading 5</h5>
      <h6 dsHeading>Heading 6</h6>`,
  }),
};
