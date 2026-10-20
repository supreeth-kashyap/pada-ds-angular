import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import {
  ButtonComponent,
  CheckboxComponent,
  DrawerContentComponent,
  DrawerParts,
} from 'pada-ds-angular';

type DrawerArgs = DrawerContentComponent & { open: boolean };

const meta: Meta<DrawerArgs> = {
  title: 'Overlays/Drawer',
  component: DrawerContentComponent,
  decorators: [moduleMetadata({ imports: [ButtonComponent, CheckboxComponent, ...DrawerParts] })],
  argTypes: {
    side: { control: 'select', options: ['left', 'right', 'top', 'bottom'] },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
  },
  args: { side: 'right', size: 'md', open: false },
  render: (args) => ({
    props: args,
    template: `
      <ds-drawer [(open)]="open">
        <button dsButton dsDialogTrigger>Filters</button>
        <ds-drawer-content [side]="side" [size]="size">
          <ds-dialog-header>
            <ds-dialog-title>Filters</ds-dialog-title>
            <ds-dialog-description>Narrow the list of members.</ds-dialog-description>
          </ds-dialog-header>
          <ds-dialog-body>
            <div style="display: grid; gap: 8px">
              <ds-checkbox label="Admins" [checked]="true" />
              <ds-checkbox label="Members" />
              <ds-checkbox label="Guests" />
            </div>
          </ds-dialog-body>
          <ds-dialog-footer>
            <button dsButton variant="secondary" dsDialogClose>Cancel</button>
            <button dsButton dsDialogClose>Apply</button>
          </ds-dialog-footer>
          <ds-dialog-close-button />
        </ds-drawer-content>
      </ds-drawer>`,
  }),
};
export default meta;
type Story = StoryObj<DrawerArgs>;

export const Right: Story = {};
export const Open: Story = { args: { open: true } };
export const Left: Story = { args: { side: 'left', open: true } };
export const Bottom: Story = { args: { side: 'bottom', size: 'sm', open: true } };
