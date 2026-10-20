import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ButtonComponent, DialogParts } from 'pada-ds-angular';

const meta: Meta = {
  title: 'Overlays/Dialog',
  decorators: [moduleMetadata({ imports: [ButtonComponent, ...DialogParts] })],
  render: () => ({
    template: `
      <ds-dialog>
        <button dsButton dsDialogTrigger>Edit profile</button>
        <ds-dialog-content size="sm">
          <ds-dialog-header>
            <ds-dialog-title>Edit profile</ds-dialog-title>
            <ds-dialog-description>Changes save automatically.</ds-dialog-description>
          </ds-dialog-header>
          <ds-dialog-body>Your name and photo are visible to your team.</ds-dialog-body>
          <ds-dialog-footer>
            <button dsButton variant="secondary" dsDialogClose>Cancel</button>
            <button dsButton dsDialogClose>Save</button>
          </ds-dialog-footer>
        </ds-dialog-content>
      </ds-dialog>`,
  }),
};
export default meta;

export const Default: StoryObj = {};
