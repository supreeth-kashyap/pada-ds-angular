import type { Meta, StoryObj } from '@storybook/angular';
import { LinkComponent } from 'pada-ds-angular';

const meta: Meta<LinkComponent> = {
  title: 'Actions/Link',
  component: LinkComponent,
  argTypes: {
    tone: { control: 'select', options: ['accent', 'neutral'] },
    underline: { control: 'select', options: ['hover', 'always'] },
  },
  args: { tone: 'accent', underline: 'hover', external: false },
  render: (args) => ({
    props: args,
    template: `<a dsLink href="#docs" [tone]="tone" [underline]="underline" [external]="external">Read the docs</a>`,
  }),
};
export default meta;
type Story = StoryObj<LinkComponent>;

export const Default: Story = {};
export const Neutral: Story = { args: { tone: 'neutral' } };
export const AlwaysUnderlined: Story = { args: { underline: 'always' } };
export const External: Story = { args: { external: true } };
