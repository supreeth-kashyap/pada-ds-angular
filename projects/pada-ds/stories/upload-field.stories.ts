import type { Meta, StoryObj } from '@storybook/angular';
import { UploadFieldComponent, type UploadedFile } from 'pada-ds-angular';

const file = (name: string, size: number, type: string) =>
  new File([new Uint8Array(size)], name, { type });

const uploaded: UploadedFile[] = [
  { id: '1', file: file('soc2-report.pdf', 1_240_000, 'application/pdf'), status: 'success' },
  {
    id: '2',
    file: file('pen-test.pdf', 3_800_000, 'application/pdf'),
    status: 'uploading',
    progress: 45,
  },
  {
    id: '3',
    file: file('policy.pdf', 9_100_000, 'application/pdf'),
    status: 'error',
    error: 'Larger than 5 MB',
  },
];

/** Pretends to upload: resolves after a short delay. */
const fakeUpload = () => new Promise<void>((resolve) => setTimeout(resolve, 1200));

const meta: Meta<UploadFieldComponent> = {
  title: 'Forms/UploadField',
  component: UploadFieldComponent,
  args: {
    label: 'Evidence',
    description: 'Upload the signed reports.',
    accept: '.pdf',
    maxSize: 5_000_000,
    multiple: true,
    files: [],
    upload: fakeUpload,
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 480px">
        <ds-upload-field [label]="label" [description]="description" [error]="error" [accept]="accept" [maxSize]="maxSize"
                         [maxFiles]="maxFiles" [multiple]="multiple" [upload]="upload" [(files)]="files" [disabled]="disabled" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<UploadFieldComponent>;

export const Default: Story = {};
export const WithFiles: Story = { args: { files: uploaded } };
export const Single: Story = {
  args: {
    multiple: false,
    maxFiles: 1,
    label: 'Logo',
    accept: 'image/*',
    description: 'PNG or SVG.',
  },
};
export const Error: Story = { args: { error: 'Upload at least one report.' } };
export const Disabled: Story = { args: { disabled: true } };
