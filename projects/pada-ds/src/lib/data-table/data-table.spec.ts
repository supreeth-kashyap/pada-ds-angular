import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle, settleUntil } from '../../../testing/settle';
import { DataTableColumn, DataTableData, DataTableParts } from './data-table';
import { toDataTableData } from './data-table.adapter';

interface Member {
  id: string;
  name: string;
  role: string;
  commits: number;
}

const members: Member[] = Array.from({ length: 14 }, (_, index) => ({
  id: `m${index + 1}`,
  name: `Member ${index + 1}`,
  role: index % 3 === 0 ? 'Owner' : index % 3 === 1 ? 'Editor' : 'Viewer',
  commits: (index * 37) % 50,
}));

const columns: DataTableColumn<Member>[] = [
  { id: 'name', header: 'Name', rowHeader: true },
  { id: 'role', header: 'Role' },
  { id: 'commits', header: 'Commits' },
];

const data: DataTableData<Member> = { columns, rows: members };

const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);
const firstCells = () =>
  bodyRows().map((row) =>
    row.querySelector('[role="rowheader"], [role="cell"]')?.textContent?.trim(),
  );

async function setup(template: string, props: Record<string, unknown> = {}) {
  return render(template, {
    imports: [...DataTableParts],
    componentProperties: { data, onSelection: vi.fn(), ...props },
  });
}

describe('DataTable', () => {
  it('renders a named table with sortable headers and the first page', async () => {
    const { fixture } = await setup(
      `<ds-data-table label="Team members" [data]="data" selectable>
         <ng-template dsDataTableCell="commits" let-row><strong>{{ row.commits }}</strong></ng-template>
       </ds-data-table>`,
    );
    expect(screen.getByRole('table', { name: 'Team members' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'none');
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByRole('rowheader', { name: 'Member 1' })).toBeInTheDocument();
    expect(bodyRows()[1].querySelector('strong')).toHaveTextContent('37');
    expect(screen.getByText('1-10 of 14')).toBeInTheDocument();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('sorts when a header is pressed', async () => {
    const { fixture } = await setup(
      `<ds-data-table label="Team members" [data]="data" [(sort)]="sort" />`,
      { sort: null },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Commits' }));
    await settle(fixture);
    expect(screen.getByRole('columnheader', { name: /Commits/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(firstCells()[0]).toBe('Member 1');
    await userEvent.click(screen.getByRole('button', { name: 'Commits' }));
    await settle(fixture);
    expect(screen.getByRole('columnheader', { name: /Commits/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(firstCells()[0]).toBe('Member 5');
    expect(fixture.componentInstance).toMatchObject({
      sort: { columnId: 'commits', direction: 'descending' },
    });
  });

  it('searches and announces the result count', async () => {
    const { fixture } = await setup(`<ds-data-table label="Team members" [data]="data" />`);
    const search = screen.getByRole('textbox', { name: 'Search Team members' });
    await userEvent.type(search, 'owner');
    await settle(fixture);
    expect(bodyRows()).toHaveLength(5);
    await settleUntil(fixture, () =>
      expect(screen.getByRole('status')).toHaveTextContent('5 results'),
    );
    await userEvent.type(search, 'zzz');
    await settle(fixture);
    expect(screen.getByText('No results for “ownerzzz”')).toBeInTheDocument();
  });

  it('selects rows, and the header box selects the page', async () => {
    const { fixture } = await setup(
      `<ds-data-table label="Team members" [data]="data" selectable (selectedIdsChange)="onSelection($event)">
         <ng-template dsDataTableActions let-rows>
           @if (rows.length) { <button type="button">Remove {{ rows.length }}</button> }
         </ng-template>
       </ds-data-table>`,
    );
    const onSelection = fixture.componentInstance.onSelection as ReturnType<typeof vi.fn>;
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Member 2' }));
    await settle(fixture);
    expect(onSelection).toHaveBeenLastCalledWith(['m2']);
    expect(bodyRows()[1]).toHaveAttribute('aria-selected', 'true');
    const all = screen.getByRole('checkbox', { name: 'Select all rows on this page' });
    expect(all).toHaveAttribute('aria-checked', 'mixed');
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    await userEvent.click(all);
    await settle(fixture);
    expect(screen.getByRole('button', { name: 'Remove 10' })).toBeInTheDocument();
    await expectNoA11yViolations(fixture.nativeElement);
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await settle(fixture);
    expect(onSelection).toHaveBeenLastCalledWith([]);
  });

  it('hides columns from the Columns menu and pages through rows', async () => {
    const { fixture } = await setup(`<ds-data-table label="Team members" [data]="data" />`);
    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await settle(fixture);
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Role' }));
    await settle(fixture);
    // The menu stays open for further changes.
    expect(screen.getByRole('menuitemcheckbox', { name: 'Role' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.queryByRole('columnheader', { name: /Role/ })).toBeNull();
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await settle(fixture);
    expect(bodyRows()).toHaveLength(4);
    expect(screen.getByText('11-14 of 14')).toBeInTheDocument();
  });

  it('shows the empty state, and a custom one', async () => {
    await setup(
      `<ds-data-table label="Empty" [data]="{ columns: columns, rows: [] }" [searchable]="false" />
       <ds-data-table label="Custom" [data]="{ columns: columns, rows: [] }">
         <ng-template dsDataTableEmpty>Nobody here yet</ng-template>
       </ds-data-table>`,
      { columns },
    );
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Nobody here yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next page' })).toBeNull();
  });

  it('leaves manual data to the server, showing its total', async () => {
    const { fixture } = await setup(
      `<ds-data-table label="Team members" manual [data]="page" [(page)]="current" />`,
      { page: { columns, rows: members.slice(0, 10), rowCount: 40 }, current: 1 },
    );
    expect(screen.getByText('1-10 of 40')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await settle(fixture);
    expect(fixture.componentInstance).toMatchObject({ current: 2 });
    expect(firstCells()[0]).toBe('Member 1');
  });
});

describe('toDataTableData', () => {
  it('adapts arrays, paged responses and nulls, deriving headers from ids', () => {
    expect(toDataTableData([{ id: 1 }], [{ id: 'createdAt' }])).toEqual({
      columns: [{ id: 'createdAt', header: 'Created at' }],
      rows: [{ id: 1 }],
    });
    expect(toDataTableData({ items: null, total: 30 }, [{ id: 'name', header: 'Who' }])).toEqual({
      columns: [{ id: 'name', header: 'Who' }],
      rows: [],
      rowCount: 30,
    });
    expect(toDataTableData(null, [{ id: 'first_name' }]).columns[0].header).toBe('First name');
  });
});
