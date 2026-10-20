import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { InfoIconComponent, InfoTooltipComponent } from 'pada-ds-angular';

const meta: Meta<InfoTooltipComponent> = {
  title: 'Display/InfoTooltip',
  component: InfoTooltipComponent,
  args: { data: { label: 'Seats', text: 'Seats are billed monthly, per active member.' } },
  render: (args) => ({
    props: args,
    template: `<span style="display: inline-flex; gap: 4px; align-items: center">Seats <ds-info-tooltip [data]="data" /></span>`,
  }),
};
export default meta;
type Story = StoryObj<InfoTooltipComponent>;

export const Default: Story = {};
export const InfoIcon: Story = {
  decorators: [moduleMetadata({ imports: [InfoIconComponent] })],
  render: () => ({ template: `<ds-info-icon />` }),
};
