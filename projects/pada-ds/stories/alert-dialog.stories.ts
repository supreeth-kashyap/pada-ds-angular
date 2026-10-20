import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { AlertDialogComponent, AlertDialogParts, ButtonComponent } from 'pada-ds-angular';

type AlertDialogArgs = AlertDialogComponent & { open: boolean };

const meta: Meta<AlertDialogArgs> = {
  title: 'Overlays/AlertDialog',
  component: AlertDialogComponent,
  decorators: [moduleMetadata({ imports: [ButtonComponent, ...AlertDialogParts] })],
  args: { open: false },
  render: (args) => ({
    props: args,
    template: `
      <ds-alert-dialog [(open)]="open">
        <button dsButton variant="destructive" dsDialogTrigger>Delete project</button>
        <ds-alert-dialog-content>
          <ds-dialog-header>
            <ds-dialog-title>Delete this project?</ds-dialog-title>
            <ds-dialog-description>This cannot be undone. Its documents and history will be removed.</ds-dialog-description>
          </ds-dialog-header>
          <ds-dialog-footer>
            <button dsButton variant="secondary" dsAlertDialogCancel>Cancel</button>
            <button dsButton variant="destructive" dsAlertDialogAction>Delete</button>
          </ds-dialog-footer>
        </ds-alert-dialog-content>
      </ds-alert-dialog>`,
  }),
};
export default meta;
type Story = StoryObj<AlertDialogArgs>;

export const Default: Story = {};
export const Open: Story = { args: { open: true } };
