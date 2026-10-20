import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ButtonComponent, DropdownMenuComponent, DropdownMenuParts } from 'pada-ds-angular';

type DropdownMenuArgs = DropdownMenuComponent & { open: boolean };

const meta: Meta<DropdownMenuArgs> = {
  title: 'Overlays/DropdownMenu',
  component: DropdownMenuComponent,
  decorators: [moduleMetadata({ imports: [ButtonComponent, ...DropdownMenuParts] })],
  args: { open: false },
  render: (args) => ({
    props: { ...args, pinned: true, sort: 'name' },
    template: `
      <div style="padding: 24px 24px 360px">
        <ds-dropdown-menu [(open)]="open">
          <button dsButton variant="secondary" rightIcon="chevron_down" dsDropdownMenuTrigger>Actions</button>
          <ds-dropdown-menu-content>
            <ds-dropdown-menu-label>Item</ds-dropdown-menu-label>
            <ds-dropdown-menu-item icon="edit_1" shortcut="⌘E">Rename</ds-dropdown-menu-item>
            <ds-dropdown-menu-item icon="copy" shortcut="⌘D">Duplicate</ds-dropdown-menu-item>
            <ds-dropdown-menu-checkbox-item [(checked)]="pinned">Pinned</ds-dropdown-menu-checkbox-item>
            <ds-dropdown-menu-separator />
            <ds-dropdown-menu-label>Sort by</ds-dropdown-menu-label>
            <ds-dropdown-menu-radio-group [(value)]="sort" aria-label="Sort by">
              <ds-dropdown-menu-radio-item value="name">Name</ds-dropdown-menu-radio-item>
              <ds-dropdown-menu-radio-item value="date">Date modified</ds-dropdown-menu-radio-item>
            </ds-dropdown-menu-radio-group>
            <ds-dropdown-menu-separator />
            <ds-dropdown-menu-sub>
              <ds-dropdown-menu-sub-trigger icon="folder">Move to</ds-dropdown-menu-sub-trigger>
              <ds-dropdown-menu-sub-content>
                <ds-dropdown-menu-item>Archive</ds-dropdown-menu-item>
                <ds-dropdown-menu-item>Shared with me</ds-dropdown-menu-item>
              </ds-dropdown-menu-sub-content>
            </ds-dropdown-menu-sub>
            <ds-dropdown-menu-item [disabled]="true">Export (coming soon)</ds-dropdown-menu-item>
            <ds-dropdown-menu-separator />
            <ds-dropdown-menu-item icon="delete" tone="danger">Delete</ds-dropdown-menu-item>
          </ds-dropdown-menu-content>
        </ds-dropdown-menu>
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<DropdownMenuArgs>;

export const Default: Story = {};
export const Open: Story = { args: { open: true } };
