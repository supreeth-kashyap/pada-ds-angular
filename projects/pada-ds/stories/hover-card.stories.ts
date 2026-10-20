import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import {
  AvatarComponent,
  HoverCardContentComponent,
  HoverCardParts,
  LinkComponent,
} from 'pada-ds-angular';

type HoverCardArgs = HoverCardContentComponent & { open: boolean };

const meta: Meta<HoverCardArgs> = {
  title: 'Overlays/HoverCard',
  component: HoverCardContentComponent,
  decorators: [moduleMetadata({ imports: [AvatarComponent, LinkComponent, ...HoverCardParts] })],
  argTypes: {
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
  },
  args: { side: 'bottom', align: 'start', open: false },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 24px 24px 160px">
        <ds-hover-card [(open)]="open" [openDelay]="300">
          <a dsLink href="#ada" dsHoverCardTrigger>&#64;ada</a>
          <ds-hover-card-content [side]="side" [align]="align">
            <div style="display: flex; gap: 12px; align-items: center">
              <ds-avatar name="Ada Lovelace" size="lg" status="online" />
              <div>
                <strong>Ada Lovelace</strong>
                <div>Engineering · London</div>
              </div>
            </div>
            <ds-hover-card-arrow />
          </ds-hover-card-content>
        </ds-hover-card>
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<HoverCardArgs>;

export const Default: Story = {};
export const Open: Story = { args: { open: true } };
