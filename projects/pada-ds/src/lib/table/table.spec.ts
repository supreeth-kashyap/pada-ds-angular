import { fireEvent, render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TableColumn } from 'pada-ds-angular/headless';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { TableParts } from './table';

const COLUMNS: TableColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'role', label: 'Role', width: 120, minWidth: 100 },
];

const EXAMPLE = `
  <ds-table label="Users" [(columns)]="columns" (columnsChange)="onColumnsChange($event)">
    <ds-table-toolbar><button type="button">Export</button></ds-table-toolbar>
    <ds-table-row>
      <ds-table-header-cell columnId="name" label="Name" [sortDirection]="sort" (sort)="onSort()" />
      <ds-table-header-cell columnId="role" label="Role" />
    </ds-table-row>
    <ds-table-row selected>
      <ds-table-cell rowHeader>Ada</ds-table-cell>
      <ds-table-cell>Owner</ds-table-cell>
    </ds-table-row>
    <ds-table-row>
      <ds-table-cell span="all">No more users</ds-table-cell>
    </ds-table-row>
    <ds-table-pagination [total]="120" [(page)]="page" [(rowsPerPage)]="size" (paginationChange)="onPage($event)" />
  </ds-table>
`;

async function setup(sort: string | undefined = 'ascending') {
  const props = {
    columns: COLUMNS,
    sort,
    page: 1,
    size: 25,
    onSort: vi.fn(),
    onColumnsChange: vi.fn(),
    onPage: vi.fn(),
  };
  const result = await render(EXAMPLE, { imports: [...TableParts], componentProperties: props });
  return { ...result, props };
}

describe('Table', () => {
  it('exposes table semantics, with the toolbar and pagination outside the table', async () => {
    const { fixture } = await setup();
    const table = screen.getByRole('table', { name: 'Users' });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(
      within(rows[0])
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual([expect.stringContaining('Name'), expect.stringContaining('Role')]);
    expect(within(rows[1]).getByRole('rowheader')).toHaveTextContent('Ada');
    expect(rows[1]).toHaveAttribute('aria-selected', 'true');
    expect(rows[1]).toHaveAttribute('data-selected', '');
    expect(rows[0]).toHaveStyle({ gridTemplateColumns: 'minmax(0, 1fr) 120px' });
    expect(within(rows[2]).getByRole('cell')).toHaveStyle({ gridColumn: '1 / -1' });
    expect(table).not.toContainElement(screen.getByRole('button', { name: 'Next page' }));
    expect(table).not.toContainElement(screen.getByRole('button', { name: 'Export' }));
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('sortable headers report aria-sort and sort on click', async () => {
    const { props } = await setup();
    const [name, role] = screen.getAllByRole('columnheader');
    expect(name).toHaveAttribute('aria-sort', 'ascending');
    expect(name).toHaveAttribute('data-sort', 'ascending');
    expect(role).not.toHaveAttribute('aria-sort');
    expect(within(role).queryByRole('button')).toBeNull();
    await userEvent.click(within(name).getByRole('button', { name: 'Name' }));
    expect(props.onSort).toHaveBeenCalledOnce();
  });

  it('resizes a column from the keyboard, not below its minimum', async () => {
    const { fixture, props } = await setup();
    const handle = screen.getByRole('separator', { name: 'Resize Role column' });
    expect(handle).toHaveAttribute('aria-valuenow', '120');
    expect(handle).toHaveAttribute('aria-valuemin', '100');
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    await settle(fixture);
    expect(handle).toHaveAttribute('aria-valuenow', '136');
    expect(props.onColumnsChange).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'role', width: 136 })]),
    );
    for (let i = 0; i < 5; i++) fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    await settle(fixture);
    expect(handle).toHaveAttribute('aria-valuenow', '100');
  });

  it('reorders columns by dropping one header on another', async () => {
    const { fixture, props } = await setup();
    const [name, role] = screen.getAllByRole('columnheader');
    expect(name).toHaveAttribute('draggable', 'true');
    const data = new Map<string, string>();
    const dataTransfer = {
      setData: (type: string, value: string) => data.set(type, value),
      getData: (type: string) => data.get(type) ?? '',
    };
    fireEvent.dragStart(role, { dataTransfer });
    fireEvent.drop(name, { dataTransfer });
    await settle(fixture);
    expect(props.onColumnsChange).toHaveBeenLastCalledWith([COLUMNS[1], COLUMNS[0]]);
  });

  it('paginates: range, page navigation and a page size that resets to page 1', async () => {
    const { fixture, props } = await setup();
    expect(screen.getByText('1-25 of 120')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await settle(fixture);
    expect(screen.getByText('26-50 of 120')).toBeInTheDocument();
    expect(props.onPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, rangeStart: 26, rangeEnd: 50, totalPages: 5 }),
    );
    await userEvent.click(screen.getByRole('tab', { name: '50' }));
    await settle(fixture);
    expect(screen.getByText('1-50 of 120')).toBeInTheDocument();
    expect(props.onPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, rowsPerPage: 50, totalPages: 3 }),
    );
  });
});
