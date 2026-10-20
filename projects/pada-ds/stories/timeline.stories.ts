import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import {
  TimelineComponent,
  TimelineParts,
  toTimelineData,
  type TimelineApiEvent,
} from 'pada-ds-angular';

/** A `GET /orders/1042/history` response: ISO timestamps, free-form statuses, nulls. */
const orderHistory: TimelineApiEvent[] = [
  { id: 'placed', title: 'Order placed', timestamp: '2026-10-12T09:24:00Z', status: 'completed', icon: 'tick_1', description: 'Paid with the Visa ending 6411.' },
  { id: 'packed', title: 'Packed', timestamp: '2026-10-13T14:02:00Z', status: 'done', description: 'Two items packed at the Bengaluru warehouse.' },
  { id: 'shipped', title: 'Shipped', timestamp: '2026-10-14T07:45:00Z', status: 'active', icon: 'share_1', description: 'Handed to BlueDart, tracking 7781 2203.' },
  { id: 'delayed', title: 'Delayed at the hub', timestamp: '2026-10-15T18:10:00Z', status: 'warning', description: 'Heavy rain; a day later than planned.' },
  { id: 'delivered', title: 'Out for delivery', timestamp: null, pending: true, description: null },
];
const auditLog: TimelineApiEvent[] = [
  { id: 'a1', title: 'Ada signed in', timestamp: '2026-10-20T08:00:00Z', status: 'info' },
  { id: 'a2', title: 'Policy “Access review” approved', timestamp: '2026-10-20T08:12:00Z', status: 'success' },
  { id: 'a3', title: 'Failed sign-in from a new device', timestamp: '2026-10-20T09:31:00Z', status: 'failed' },
  { id: 'a4', title: 'API key rotated', timestamp: '2026-10-20T10:05:00Z' },
];
const links: Record<string, string> = { shipped: '#tracking' };

const meta: Meta<TimelineComponent> = {
  title: 'Data/Timeline',
  component: TimelineComponent,
  decorators: [moduleMetadata({ imports: [...TimelineParts] })],
  argTypes: { density: { control: 'select', options: ['compact', 'comfortable'] } },
  args: { data: toTimelineData(orderHistory), density: 'comfortable' },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 420px"><ds-timeline [data]="data" [density]="density" /></div>`,
  }),
};
export default meta;
type Story = StoryObj<TimelineComponent>;

export const Default: Story = {};
export const Compact: Story = { args: { data: toTimelineData(auditLog), density: 'compact' } };
export const Tones: Story = {
  args: {
    data: {
      items: [
        { title: 'Neutral', tone: 'neutral' },
        { title: 'Accent', tone: 'accent' },
        { title: 'Success', tone: 'success' },
        { title: 'Warning', tone: 'warning' },
        { title: 'Danger', tone: 'danger' },
        { title: 'Pending', pending: true },
      ],
    },
  },
};
export const CustomContent: Story = {
  render: (args) => ({
    props: { ...args, links },
    template: `
      <div style="max-width: 420px">
        <ds-timeline [data]="data">
          <ng-template dsTimelineItemContent let-item>
            @if (links[item.id]) { <a [href]="links[item.id]">{{ item.description }}</a> } @else { {{ item.description }} }
          </ng-template>
        </ds-timeline>
      </div>`,
  }),
};
