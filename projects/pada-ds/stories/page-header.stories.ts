import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import {
  AvatarComponent,
  PageHeaderComponent,
  PageHeaderParts,
  type BreadcrumbItem,
} from 'pada-ds-angular';
import { portrait } from './sample-images';

const trail: BreadcrumbItem[] = [
  { label: 'Workspace', href: '#' },
  { label: 'Reports', href: '#' },
  { label: 'Quarterly', href: '#' },
  { label: 'Q3 revenue' },
];

const meta: Meta<PageHeaderComponent> = {
  title: 'Navigation/PageHeader',
  component: PageHeaderComponent,
  decorators: [moduleMetadata({ imports: [...PageHeaderParts, AvatarComponent] })],
  args: {
    breadcrumbs: trail.slice(0, 2).concat(trail.slice(-1)),
    commandLabel: 'Search',
    commandShortcut: '⌘+K',
    aiLabel: 'AI',
    profileLabel: 'Account',
  },
  render: (args) => ({
    props: { ...args, go: (e: { event: MouseEvent }) => e.event.preventDefault() },
    template: `
      <div style="padding-bottom: 200px">
        <ds-page-header [breadcrumbs]="breadcrumbs" [commandLabel]="commandLabel"
          [commandShortcut]="commandShortcut" [aiLabel]="aiLabel" [profileLabel]="profileLabel"
          (navigate)="go($event)">
          <div dsPageHeaderProfileMenu style="padding: 8px; display: grid; gap: 4px">
            <strong>Ada Lovelace</strong>
            <span>ada&#64;example.com</span>
          </div>
        </ds-page-header>
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<PageHeaderComponent>;

export const Default: Story = {};
export const LongTrail: Story = { args: { breadcrumbs: trail } };
export const WithAvatar: Story = {
  render: (args) => ({
    props: { ...args, photo: portrait(200) },
    template: `
      <ds-page-header [breadcrumbs]="breadcrumbs">
        <ds-avatar dsPageHeaderProfileTrigger [src]="photo" name="Ada Lovelace" size="sm" />
      </ds-page-header>`,
  }),
};
