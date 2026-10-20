import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import {
  BadgeComponent,
  ButtonComponent,
  DataTableComponent,
  DataTableParts,
  EmptyStateComponent,
  toDataTableData,
  type DataTableColumnInput,
} from 'pada-ds-angular';
import { membersResponse, type Member } from './sample-data';

const columns: DataTableColumnInput<Member>[] = [
  { id: 'name', rowHeader: true, width: 200 },
  { id: 'email', sortable: false },
  { id: 'role', width: 120 },
  { id: 'status', width: 120 },
  { id: 'commits', width: 110 },
  { id: 'joined', header: 'Joined', width: 130 },
];
const data = toDataTableData(membersResponse, columns);
const tone = (status: Member['status']) =>
  status === 'Active' ? 'success' : status === 'Invited' ? 'info' : 'danger';

type DataTableArgs = DataTableComponent<Member>;

const meta: Meta<DataTableArgs> = {
  title: 'Data/DataTable',
  component: DataTableComponent,
  decorators: [moduleMetadata({ imports: [...DataTableParts, BadgeComponent, ButtonComponent, EmptyStateComponent] })],
  args: {
    data,
    label: 'Team members',
    selectable: false,
    searchable: true,
    columnToggle: true,
  },
  render: (args) => ({
    props: { ...args, tone },
    template: `
      <ds-data-table [data]="data" [label]="label" [selectable]="selectable" [searchable]="searchable"
        [columnToggle]="columnToggle" [pageSizeOptions]="[10, 25, 50]">
        <ng-template dsDataTableCell="status" let-row>
          <ds-badge [tone]="tone(row.status)">{{ row.status }}</ds-badge>
        </ng-template>
        <ng-template dsDataTableCell="commits" let-row><strong>{{ row.commits }}</strong></ng-template>
        <ng-template dsDataTableActions let-rows>
          @if (rows.length) {
            <button dsButton size="sm" variant="destructive" leftIcon="delete">Remove {{ rows.length }}</button>
          }
        </ng-template>
      </ds-data-table>`,
  }),
};
export default meta;
type Story = StoryObj<DataTableArgs>;

export const Default: Story = {};
export const Selectable: Story = { args: { selectable: true } };
export const Minimal: Story = { args: { searchable: false, columnToggle: false } };
export const Empty: Story = {
  args: { data: toDataTableData<Member>({ items: null, total: 0 }, columns) },
  render: (args) => ({
    props: args,
    template: `
      <ds-data-table [data]="data" [label]="label">
        <ng-template dsDataTableEmpty>
          <ds-empty-state title="No members yet" description="Invite your team to get started." />
        </ng-template>
      </ds-data-table>`,
  }),
};
