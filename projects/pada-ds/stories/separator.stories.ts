import type { Meta, StoryObj } from '@storybook/angular';
import { SeparatorComponent } from 'pada-ds-angular';

const meta: Meta<SeparatorComponent> = {
  title: 'Display/Separator',
  component: SeparatorComponent,
  render: () => ({
    template: `
      <div style="max-width: 320px">
        <p style="margin: 0">Account</p>
        <ds-separator style="margin: 12px 0" />
        <p style="margin: 0">Billing</p>
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<SeparatorComponent>;

export const Horizontal: Story = {};
export const Vertical: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 12px; height: 24px">
        <span>Docs</span>
        <ds-separator orientation="vertical" [decorative]="false" />
        <span>Blog</span>
        <ds-separator orientation="vertical" [decorative]="false" />
        <span>Changelog</span>
      </div>`,
  }),
};
