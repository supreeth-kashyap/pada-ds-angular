import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { BannerComponent, ButtonComponent } from 'pada-ds-angular';
import { landscape } from './sample-images';

const meta: Meta<BannerComponent> = {
  title: 'Feedback/Banner',
  component: BannerComponent,
  decorators: [moduleMetadata({ imports: [ButtonComponent] })],
  args: { title: 'Invite your team', subtitle: 'Pada is better together.', visualIcon: 'team' },
  render: (args) => ({
    props: args,
    template: `
      <ds-banner [title]="title" [subtitle]="subtitle" [visualIcon]="visualIcon" [visualImage]="visualImage" [visualAlt]="visualAlt">
        <button dsButton variant="secondary">Invite</button>
      </ds-banner>`,
  }),
};
export default meta;
type Story = StoryObj<BannerComponent>;

export const WithIcon: Story = {};
export const WithImage: Story = {
  args: {
    visualIcon: undefined,
    visualImage: landscape(260, ''),
    visualAlt: '',
    title: 'Your quarterly report is ready',
    subtitle: 'See how your team did in Q3.',
  },
};
export const TitleOnly: Story = { args: { subtitle: undefined, visualIcon: undefined } };
