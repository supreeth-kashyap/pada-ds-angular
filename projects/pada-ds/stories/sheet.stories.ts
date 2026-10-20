import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ButtonComponent, SheetContentComponent, SheetParts } from 'pada-ds-angular';

type SheetArgs = SheetContentComponent & { open: boolean };

const meta: Meta<SheetArgs> = {
  title: 'Overlays/Sheet',
  component: SheetContentComponent,
  decorators: [moduleMetadata({ imports: [ButtonComponent, ...SheetParts] })],
  args: { open: false, dismissible: true },
  render: (args) => ({
    props: args,
    template: `
      <ds-sheet [(open)]="open">
        <button dsButton dsDialogTrigger>Share</button>
        <ds-sheet-content [snapPoints]="snapPoints" [(snap)]="snap" [dismissible]="dismissible">
          <ds-dialog-header>
            <ds-dialog-title>Share</ds-dialog-title>
            <ds-dialog-description>Anyone with the link can view.</ds-dialog-description>
          </ds-dialog-header>
          <ds-dialog-body>
            <p>Copy the link, or invite people by email.</p>
          </ds-dialog-body>
          <ds-dialog-footer>
            <button dsButton variant="secondary" dsDialogClose>Close</button>
            <button dsButton>Copy link</button>
          </ds-dialog-footer>
        </ds-sheet-content>
      </ds-sheet>`,
  }),
};
export default meta;
type Story = StoryObj<SheetArgs>;

export const Default: Story = {};
export const Open: Story = { args: { open: true } };
export const SnapPoints: Story = { args: { open: true, snapPoints: [0.5, 0.9] } };
