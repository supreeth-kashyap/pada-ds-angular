import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { IconButtonComponent, TooltipContentComponent, TooltipParts } from 'pada-ds-angular';

type TooltipArgs = TooltipContentComponent & { open: boolean };

const meta: Meta<TooltipArgs> = {
  title: 'Overlays/Tooltip',
  component: TooltipContentComponent,
  decorators: [moduleMetadata({ imports: [IconButtonComponent, ...TooltipParts] })],
  argTypes: {
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
  },
  args: { side: 'top', align: 'center', open: false },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 64px">
        <ds-tooltip [(open)]="open">
          <button dsIconButton dsTooltipTrigger icon="download_2" label="Download"></button>
          <ds-tooltip-content [side]="side" [align]="align">Download as PDF<ds-tooltip-arrow /></ds-tooltip-content>
        </ds-tooltip>
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<TooltipArgs>;

export const Default: Story = {};
export const Open: Story = { args: { open: true } };
export const Bottom: Story = { args: { open: true, side: 'bottom' } };
export const Provider: Story = {
  render: () => ({
    template: `
      <div style="padding: 64px">
        <ds-tooltip-provider [delayDuration]="500">
          <div style="display: flex; gap: 4px">
            <ds-tooltip>
              <button dsIconButton dsTooltipTrigger icon="edit_1" label="Rename"></button>
              <ds-tooltip-content>Rename</ds-tooltip-content>
            </ds-tooltip>
            <ds-tooltip>
              <button dsIconButton dsTooltipTrigger icon="copy" label="Duplicate"></button>
              <ds-tooltip-content>Duplicate</ds-tooltip-content>
            </ds-tooltip>
            <ds-tooltip>
              <button dsIconButton dsTooltipTrigger icon="delete" label="Delete"></button>
              <ds-tooltip-content>Delete</ds-tooltip-content>
            </ds-tooltip>
          </div>
        </ds-tooltip-provider>
      </div>`,
  }),
};
