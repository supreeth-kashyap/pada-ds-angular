import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { MenubarComponent, MenubarParts } from 'pada-ds-angular';

type MenubarArgs = MenubarComponent & { value: string | undefined };

const meta: Meta<MenubarArgs> = {
  title: 'Navigation/Menubar',
  component: MenubarComponent,
  decorators: [moduleMetadata({ imports: [...MenubarParts] })],
  args: { value: undefined },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding-bottom: 220px">
        <ds-menubar aria-label="Editor" [(value)]="value">
          <ds-menubar-menu value="file">
            <ds-menubar-trigger>File</ds-menubar-trigger>
            <ds-menubar-content>
              <ds-dropdown-menu-item shortcut="⌘N">New file</ds-dropdown-menu-item>
              <ds-dropdown-menu-item shortcut="⌘O">Open…</ds-dropdown-menu-item>
              <ds-dropdown-menu-item shortcut="⌘S">Save</ds-dropdown-menu-item>
              <ds-dropdown-menu-separator />
              <ds-dropdown-menu-item>Close</ds-dropdown-menu-item>
            </ds-menubar-content>
          </ds-menubar-menu>
          <ds-menubar-menu value="edit">
            <ds-menubar-trigger>Edit</ds-menubar-trigger>
            <ds-menubar-content>
              <ds-dropdown-menu-item shortcut="⌘Z">Undo</ds-dropdown-menu-item>
              <ds-dropdown-menu-item shortcut="⇧⌘Z">Redo</ds-dropdown-menu-item>
              <ds-dropdown-menu-separator />
              <ds-dropdown-menu-item shortcut="⌘C">Copy</ds-dropdown-menu-item>
              <ds-dropdown-menu-item shortcut="⌘V">Paste</ds-dropdown-menu-item>
            </ds-menubar-content>
          </ds-menubar-menu>
          <ds-menubar-menu value="view">
            <ds-menubar-trigger>View</ds-menubar-trigger>
            <ds-menubar-content>
              <ds-dropdown-menu-item>Zoom in</ds-dropdown-menu-item>
              <ds-dropdown-menu-item>Zoom out</ds-dropdown-menu-item>
            </ds-menubar-content>
          </ds-menubar-menu>
          <ds-menubar-menu value="help">
            <ds-menubar-trigger disabled>Help</ds-menubar-trigger>
            <ds-menubar-content>
              <ds-dropdown-menu-item>Documentation</ds-dropdown-menu-item>
            </ds-menubar-content>
          </ds-menubar-menu>
        </ds-menubar>
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<MenubarArgs>;

export const Default: Story = {};
export const FileOpen: Story = { args: { value: 'file' } };
