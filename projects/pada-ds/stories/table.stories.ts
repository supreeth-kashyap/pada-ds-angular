import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import {
  BadgeComponent,
  ButtonComponent,
  TableComponent,
  TableParts,
} from 'pada-ds-angular';
import { membersResponse, type Member } from './sample-data';

const columns = [
  { id: 'name', label: 'Name', width: 200 },
  { id: 'email', label: 'Email' },
  { id: 'role', label: 'Role', width: 120 },
  { id: 'status', label: 'Status', width: 120 },
];
const tone = (status: Member['status']) =>
  status === 'Active' ? 'success' : status === 'Invited' ? 'info' : 'danger';

const meta: Meta<TableComponent> = {
  title: 'Data/Table',
  component: TableComponent,
  decorators: [moduleMetadata({ imports: [...TableParts, BadgeComponent, ButtonComponent] })],
  args: { label: 'Team members' },
  render: (args) => {
    const sort = signal<'ascending' | 'descending'>('ascending');
    const page = signal(1);
    const rowsPerPage = signal(25);
    const all = membersResponse.items;
    return {
      props: {
        ...args,
        columns: signal(columns),
        sort,
        page,
        rowsPerPage,
        tone,
        total: all.length,
        toggle: () => sort.update((d) => (d === 'ascending' ? 'descending' : 'ascending')),
        rows: () => {
          const sorted = [...all].sort((a, b) => a.name.localeCompare(b.name) * (sort() === 'ascending' ? 1 : -1));
          const start = (page() - 1) * rowsPerPage();
          return sorted.slice(start, start + rowsPerPage());
        },
        picked: new Set(['m-101', 'm-104']),
      },
      template: `
        <ds-table [label]="label" [(columns)]="columns">
          <ds-table-toolbar><button dsButton size="sm" variant="secondary" leftIcon="download_2">Export</button></ds-table-toolbar>
          <ds-table-row>
            @for (column of columns(); track column.id) {
              @if (column.id === 'name') {
                <ds-table-header-cell columnId="name" label="Name" [sortDirection]="sort()" (sort)="toggle()" />
              } @else {
                <ds-table-header-cell [columnId]="column.id" [label]="column.label" />
              }
            }
          </ds-table-row>
          @for (user of rows(); track user.id) {
            <ds-table-row [selected]="picked.has(user.id)">
              @for (column of columns(); track column.id) {
                @switch (column.id) {
                  @case ('name') { <ds-table-cell rowHeader>{{ user.name }}</ds-table-cell> }
                  @case ('status') { <ds-table-cell><ds-badge [tone]="tone(user.status)">{{ user.status }}</ds-badge></ds-table-cell> }
                  @default { <ds-table-cell>{{ $any(user)[column.id] }}</ds-table-cell> }
                }
              }
            </ds-table-row>
          }
          <ds-table-pagination [total]="total" [(page)]="page" [(rowsPerPage)]="rowsPerPage" [rowsPerPageOptions]="[10, 25, 50]" />
        </ds-table>`,
    };
  },
};
export default meta;
type Story = StoryObj<TableComponent>;

export const Default: Story = {};
export const Plain: Story = {
  render: (args) => ({
    props: { ...args, rows: membersResponse.items.slice(0, 5) },
    template: `
      <ds-table [label]="label">
        <ds-table-row>
          <ds-table-header-cell label="Name" />
          <ds-table-header-cell label="Role" />
          <ds-table-header-cell label="Joined" />
        </ds-table-row>
        @for (user of rows; track user.id) {
          <ds-table-row>
            <ds-table-cell rowHeader>{{ user.name }}</ds-table-cell>
            <ds-table-cell>{{ user.role }}</ds-table-cell>
            <ds-table-cell>{{ user.joined }}</ds-table-cell>
          </ds-table-row>
        }
      </ds-table>`,
  }),
};
export const Empty: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ds-table [label]="label">
        <ds-table-row>
          <ds-table-header-cell label="Name" />
          <ds-table-header-cell label="Role" />
        </ds-table-row>
        <ds-table-row><ds-table-cell span="all">No members yet.</ds-table-cell></ds-table-row>
      </ds-table>`,
  }),
};
