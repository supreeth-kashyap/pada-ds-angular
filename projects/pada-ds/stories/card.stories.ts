import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ButtonComponent, CardComponent } from 'pada-ds-angular';

const meta: Meta<CardComponent> = {
  title: 'Display/Card',
  component: CardComponent,
  decorators: [moduleMetadata({ imports: [ButtonComponent] })],
  render: () => ({
    template: `
      <ds-card style="max-width: 320px">
        <h3 style="margin: 0 0 8px">Usage</h3>
        <p style="margin: 0">42 of 50 seats used.</p>
      </ds-card>`,
  }),
};
export default meta;
type Story = StoryObj<CardComponent>;

export const Default: Story = {};
export const WithActions: Story = {
  render: () => ({
    template: `
      <ds-card style="max-width: 360px">
        <h3 style="margin: 0 0 8px">Upgrade to Pro</h3>
        <p style="margin: 0 0 16px">Unlimited projects, audit logs and SSO.</p>
        <button dsButton size="sm">Upgrade</button>
      </ds-card>`,
  }),
};
