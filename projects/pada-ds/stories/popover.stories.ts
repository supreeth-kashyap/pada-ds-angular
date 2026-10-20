import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import {
  ButtonComponent,
  CheckboxComponent,
  PopoverContentComponent,
  PopoverParts,
} from 'pada-ds-angular';

type PopoverArgs = PopoverContentComponent & { open: boolean };

const meta: Meta<PopoverArgs> = {
  title: 'Overlays/Popover',
  component: PopoverContentComponent,
  decorators: [moduleMetadata({ imports: [ButtonComponent, CheckboxComponent, ...PopoverParts] })],
  argTypes: {
    variant: { control: 'select', options: ['default', 'dashed', 'active'] },
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
  },
  args: { variant: 'default', side: 'bottom', align: 'start', open: false },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 24px 24px 220px">
        <ds-popover [(open)]="open">
          <button dsButton variant="secondary" dsPopoverTrigger>Filters</button>
          <ds-popover-content [variant]="variant" [side]="side" [align]="align">
            <ds-popover-title>Filters</ds-popover-title>
            <div style="display: grid; gap: 8px; margin-top: 8px">
              <ds-checkbox label="Assigned to me" />
              <ds-checkbox label="Overdue" />
            </div>
            <ds-popover-close-button />
            <ds-popover-arrow />
          </ds-popover-content>
        </ds-popover>
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<PopoverArgs>;

export const Default: Story = {};
export const Open: Story = { args: { open: true } };
export const Dashed: Story = { args: { open: true, variant: 'dashed' } };
export const Active: Story = { args: { open: true, variant: 'active' } };
export const Right: Story = { args: { open: true, side: 'right', align: 'center' } };
