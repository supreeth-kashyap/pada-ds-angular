import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ContextMenuComponent, ContextMenuParts } from 'pada-ds-angular';

const meta: Meta<ContextMenuComponent> = {
  title: 'Overlays/ContextMenu',
  component: ContextMenuComponent,
  decorators: [moduleMetadata({ imports: [...ContextMenuParts] })],
  render: () => ({
    template: `
      <ds-context-menu>
        <ds-context-menu-trigger tabindex="0">
          <div style="display: grid; place-items: center; width: 320px; height: 160px; border: 1px dashed currentColor; border-radius: 8px">
            Right-click Report.pdf (or press Shift+F10)
          </div>
        </ds-context-menu-trigger>
        <ds-context-menu-content ariaLabel="File actions">
          <ds-dropdown-menu-item icon="edit_1" shortcut="F2">Rename</ds-dropdown-menu-item>
          <ds-dropdown-menu-item icon="share_1">Share</ds-dropdown-menu-item>
          <ds-dropdown-menu-item icon="download_2">Download</ds-dropdown-menu-item>
          <ds-dropdown-menu-separator />
          <ds-dropdown-menu-item icon="delete" tone="danger">Delete</ds-dropdown-menu-item>
        </ds-context-menu-content>
      </ds-context-menu>`,
  }),
};
export default meta;
type Story = StoryObj<ContextMenuComponent>;

export const Default: Story = {};
