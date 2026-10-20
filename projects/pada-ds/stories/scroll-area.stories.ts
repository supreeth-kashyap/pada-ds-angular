import type { Meta, StoryObj } from '@storybook/angular';
import { ScrollAreaComponent } from 'pada-ds-angular';

const events = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  text: `${['Ada', 'Grace', 'Linus', 'Margaret'][i % 4]} ${['commented on', 'closed', 'opened', 'assigned'][i % 4]} task #${120 + i}`,
}));

const meta: Meta<ScrollAreaComponent> = {
  title: 'Layout/ScrollArea',
  component: ScrollAreaComponent,
  argTypes: {
    orientation: { control: 'select', options: ['vertical', 'horizontal', 'both'] },
    scrollbar: { control: 'select', options: ['auto', 'always'] },
  },
  args: { orientation: 'vertical', maxHeight: 240, fade: true, scrollbar: 'auto' },
  render: (args) => ({
    props: { ...args, events },
    template: `
      <ds-scroll-area [orientation]="orientation" [maxHeight]="maxHeight" [fade]="fade" [scrollbar]="scrollbar"
        aria-label="Activity" style="width: 320px; border: 1px solid var(--pada-color-border); border-radius: 8px">
        <div style="padding: 0 12px">
          @for (event of events; track event.id) { <p>{{ event.text }}</p> }
        </div>
      </ds-scroll-area>`,
  }),
};
export default meta;
type Story = StoryObj<ScrollAreaComponent>;

export const Default: Story = {};
export const NoFade: Story = { args: { fade: false } };
export const AlwaysShowScrollbar: Story = { args: { scrollbar: 'always' } };
export const Horizontal: Story = {
  args: { orientation: 'horizontal', maxWidth: 360 },
  render: (args) => ({
    props: { ...args, cards: Array.from({ length: 12 }, (_, i) => i + 1) },
    template: `
      <ds-scroll-area [orientation]="orientation" [maxWidth]="maxWidth" [fade]="fade" aria-label="Projects">
        <div style="display: flex; gap: 12px; padding: 8px; width: max-content">
          @for (card of cards; track card) {
            <div style="width: 120px; height: 80px; border-radius: 8px; border: 1px solid var(--pada-color-border); display: grid; place-items: center">Project {{ card }}</div>
          }
        </div>
      </ds-scroll-area>`,
  }),
};
