import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { AvatarComponent, BadgeComponent, KeyValueComponent } from 'pada-ds-angular';

const meta: Meta<KeyValueComponent> = {
  title: 'Display/KeyValue',
  component: KeyValueComponent,
  decorators: [moduleMetadata({ imports: [AvatarComponent, BadgeComponent] })],
  args: { label: 'Region', infoTooltip: undefined },
  render: (args) => ({
    props: args,
    template: `<ds-key-value [label]="label" [infoTooltip]="infoTooltip">eu-west-1</ds-key-value>`,
  }),
};
export default meta;
type Story = StoryObj<KeyValueComponent>;

export const Default: Story = {};
export const WithInfoTooltip: Story = {
  args: { label: 'Owner', infoTooltip: 'Who approves changes' },
  render: (args) => ({
    props: args,
    template: `
      <ds-key-value [label]="label" [infoTooltip]="infoTooltip">
        <ds-avatar name="Ada Lovelace" size="sm" /> Ada Lovelace
      </ds-key-value>`,
  }),
};
export const Rows: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 8px; max-width: 400px">
        <ds-key-value label="Plan">Business</ds-key-value>
        <ds-key-value label="Status"><ds-badge tone="success" dot>Active</ds-badge></ds-key-value>
        <ds-key-value label="Renews">1 March 2027</ds-key-value>
      </div>`,
  }),
};
