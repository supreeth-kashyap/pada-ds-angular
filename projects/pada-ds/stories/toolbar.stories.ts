import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import {
  FilterChipComponent,
  FilterComponent,
  MoreFilterComponent,
  ToolbarComponent,
  ToolbarParts,
  type FilterOption,
  type MoreFilterDescriptor,
  type ToolbarAction,
} from 'pada-ds-angular';

const statuses: FilterOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
];
const owners: FilterOption[] = [
  { value: 'ada', label: 'Ada Lovelace', iconName: 'user_default' },
  { value: 'grace', label: 'Grace Hopper', iconName: 'user_default' },
  { value: 'linus', label: 'Linus Torvalds', iconName: 'user_default' },
];
const more: MoreFilterDescriptor[] = [
  {
    id: 'role',
    label: 'Role',
    multiSelect: true,
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'editor', label: 'Editor' },
      { value: 'viewer', label: 'Viewer' },
    ],
  },
  {
    id: 'region',
    label: 'Region',
    options: [
      { value: 'in', label: 'India' },
      { value: 'eu', label: 'Europe' },
      { value: 'us', label: 'United States' },
    ],
  },
];
const actions: ToolbarAction[] = [
  { id: 'export', label: 'Export', variant: 'secondary', leftIcon: 'download_2' },
];
const primary: ToolbarAction = { id: 'invite', label: 'Invite', leftIcon: 'user_add' };

const meta: Meta<ToolbarComponent> = {
  title: 'Navigation/Toolbar',
  component: ToolbarComponent,
  decorators: [moduleMetadata({ imports: [...ToolbarParts] })],
  args: { actions, primaryAction: primary },
  render: (args) => ({
    props: { ...args, statuses, owners, more, status: ['active'], owner: [], extra: {} },
    template: `
      <div style="padding-bottom: 320px">
        <ds-toolbar aria-label="Members" [actions]="actions" [primaryAction]="primaryAction">
          <ds-filter label="Status" [options]="statuses" [(value)]="status" />
          <ds-filter label="Owner" [options]="owners" multiSelect [(value)]="owner" />
          <ds-more-filter [filters]="more" [(value)]="extra" />
        </ds-toolbar>
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<ToolbarComponent>;

export const Default: Story = {};
export const FiltersOnly: Story = { args: { actions: [], primaryAction: undefined } };
export const AppliedFilters: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ds-toolbar aria-label="Applied filters" [actions]="actions" [primaryAction]="primaryAction">
        <ds-filter-chip label="Owner" value="Ada" />
        <ds-filter-chip label="Status" value="Active" />
        <ds-filter-chip variant="prompt" label="Add filter" [showClose]="false" />
      </ds-toolbar>`,
  }),
};

export const SingleSelectFilter: StoryObj<FilterComponent> = {
  render: () => ({
    props: { statuses, status: [] as string[] },
    template: `<div style="padding-bottom: 220px"><ds-filter label="Status" [options]="statuses" [(value)]="status" /></div>`,
  }),
};
export const MultiSelectFilter: StoryObj<FilterComponent> = {
  render: () => ({
    props: { owners, owner: ['ada', 'grace'] },
    template: `<div style="padding-bottom: 260px"><ds-filter label="Owner" [options]="owners" multiSelect [(value)]="owner" /></div>`,
  }),
};
export const MoreFilters: StoryObj<MoreFilterComponent> = {
  render: () => ({
    props: { more, extra: { role: ['admin'] } },
    template: `<div style="padding-bottom: 260px"><ds-more-filter [filters]="more" [(value)]="extra" /></div>`,
  }),
};
export const FilterChips: StoryObj<FilterChipComponent> = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap">
        <ds-filter-chip label="Owner" value="Ada" />
        <ds-filter-chip variant="prompt" label="Add filter" [showClose]="false" />
        <ds-filter-chip variant="button" label="Filters" value="3" [showClose]="false" />
        <ds-filter-chip label="Region" value="India" disabled />
      </div>`,
  }),
};
