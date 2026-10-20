import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { TabsComponent, TabsParts } from 'pada-ds-angular';

type TabsArgs = TabsComponent & { value: string };

const meta: Meta<TabsArgs> = {
  title: 'Navigation/Tabs',
  component: TabsComponent,
  decorators: [moduleMetadata({ imports: [...TabsParts] })],
  argTypes: { variant: { control: 'select', options: ['underline', 'pills'] } },
  args: { variant: 'underline', value: 'overview' },
  render: (args) => ({
    props: args,
    template: `
      <ds-tabs [(value)]="value" [variant]="variant">
        <ds-tabs-list aria-label="Project">
          <ds-tabs-trigger value="overview">Overview</ds-tabs-trigger>
          <ds-tabs-trigger value="activity" notification>Activity</ds-tabs-trigger>
          <ds-tabs-trigger value="members">Members</ds-tabs-trigger>
          <ds-tabs-trigger value="billing" disabled>Billing</ds-tabs-trigger>
        </ds-tabs-list>
        <ds-tabs-content value="overview"><p>Twelve open tasks, three due this week.</p></ds-tabs-content>
        <ds-tabs-content value="activity"><p>Ada commented on the roadmap.</p></ds-tabs-content>
        <ds-tabs-content value="members"><p>Ada, Grace and Linus.</p></ds-tabs-content>
        <ds-tabs-content value="billing"><p>Billing is managed by your admin.</p></ds-tabs-content>
      </ds-tabs>`,
  }),
};
export default meta;
type Story = StoryObj<TabsArgs>;

export const Default: Story = {};
export const Pills: Story = { args: { variant: 'pills' } };
export const SecondTab: Story = { args: { value: 'activity' } };
