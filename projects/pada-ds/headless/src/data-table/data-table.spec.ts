import { signal } from '@angular/core';
import { compareValues, createDataTable, DataTableColumnDef } from './data-table';

interface Person {
  id: string;
  name: string;
  age: number | null;
  joined: Date;
}

const people: Person[] = [
  { id: 'a', name: 'Ada', age: 36, joined: new Date('2024-03-01') },
  { id: 'b', name: 'grace', age: 85, joined: new Date('2023-01-15') },
  { id: 'c', name: 'Alan', age: null, joined: new Date('2024-07-30') },
  { id: 'd', name: 'Edsger 10', age: 72, joined: new Date('2022-11-02') },
  { id: 'e', name: 'Edsger 9', age: 41, joined: new Date('2025-02-14') },
];
const columns: DataTableColumnDef<Person>[] = [
  { id: 'name' },
  { id: 'age' },
  { id: 'joined' },
  { id: 'initial', accessor: (row) => row.name[0], searchable: false },
];
const names = (rows: readonly { original: Person }[]) => rows.map((row) => row.original.name);

describe('createDataTable', () => {
  it('compares numbers, dates and text naturally, with blanks last', () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
    expect(compareValues('item 2', 'item 10')).toBeLessThan(0);
    expect(compareValues('ada', 'Ada')).toBe(0);
    expect(compareValues(null, 1)).toBeGreaterThan(0);
    expect(compareValues(new Date(1), new Date(2))).toBeLessThan(0);
    expect(compareValues(false, true)).toBeLessThan(0);
  });

  it('sorts by a column, cycling ascending, descending and off', () => {
    const table = createDataTable({ data: () => people, columns: () => columns });
    table.toggleSort('age');
    expect(names(table.rows())).toEqual(['Ada', 'Edsger 9', 'Edsger 10', 'grace', 'Alan']);
    table.toggleSort('age');
    expect(table.getSortDirection('age')).toBe('descending');
    expect(names(table.rows())).toEqual(['grace', 'Edsger 10', 'Edsger 9', 'Ada', 'Alan']);
    table.toggleSort('age');
    expect(table.sort()).toBeNull();
    expect(names(table.rows())).toEqual(people.map((person) => person.name));
    table.toggleSort('joined');
    expect(names(table.rows())[0]).toBe('Edsger 10');
  });

  it('searches searchable columns and resets to the first page', () => {
    const table = createDataTable({
      data: () => people,
      columns: () => columns,
      pageSize: signal(2),
      page: signal(2),
    });
    expect(table.currentPage()).toBe(2);
    table.setSearch('edsger');
    expect(table.currentPage()).toBe(1);
    expect(table.total()).toBe(2);
    table.setSearch('E');
    // "initial" is not searchable, so only names containing "e" match.
    expect(names(table.rows())).toEqual(['grace', 'Edsger 10']);
    table.setSearch('2024-03');
    expect(names(table.rows())).toEqual(['Ada']);
  });

  it('pages the sorted rows and clamps the page', () => {
    const table = createDataTable({
      data: () => people,
      columns: () => columns,
      defaultPageSize: () => 2,
    });
    expect(table.pageCount()).toBe(3);
    table.setPage(3);
    expect(names(table.rows())).toEqual(['Edsger 9']);
    table.setPage(9);
    expect(table.currentPage()).toBe(3);
    table.setPageSize(10);
    expect(table.currentPage()).toBe(1);
    expect(table.rows()).toHaveLength(5);
  });

  it('selects rows and whole pages, through a signal you own', () => {
    const selectedIds = signal<readonly string[]>([]);
    const table = createDataTable({
      data: () => people,
      columns: () => columns,
      pageSize: signal(2),
      selectedIds,
    });
    table.toggleRow('a');
    expect(table.pageSelection()).toBe('some');
    table.togglePage();
    expect([...selectedIds()].sort()).toEqual(['a', 'b']);
    expect(table.pageSelection()).toBe('all');
    expect(table.selectedRows().map((row) => row.name)).toEqual(['Ada', 'grace']);
    table.togglePage();
    expect(selectedIds()).toEqual([]);
    table.toggleRow('c');
    table.clearSelection();
    expect(table.isSelected('c')).toBe(false);
  });

  it('hides columns and leaves manual data untouched', () => {
    const table = createDataTable({
      data: () => people.slice(0, 2),
      columns: () => columns,
      manual: () => true,
      rowCount: () => 40,
      sort: signal({ columnId: 'age', direction: 'descending' as const }),
    });
    table.toggleColumn('age');
    expect(table.isColumnVisible('age')).toBe(false);
    expect(table.visibleColumns().map((column) => column.id)).toEqual([
      'name',
      'joined',
      'initial',
    ]);
    expect(table.total()).toBe(40);
    expect(table.pageCount()).toBe(4);
    expect(names(table.rows())).toEqual(['Ada', 'grace']);
    table.toggleColumn('age');
    expect(table.isColumnVisible('age')).toBe(true);
  });

  it('uses custom row ids, search and sort functions', () => {
    const table = createDataTable({
      data: () => people,
      columns: () => [
        { id: 'name', sortFn: (a: Person, b: Person) => a.name.length - b.name.length },
      ],
      getRowId: () => (row: Person) => `p-${row.id}`,
      searchFn: () => (row: Person, query: string) => row.id === query,
    });
    expect(table.rows()[0].id).toBe('p-a');
    table.toggleSort('name');
    expect(names(table.rows()).slice(0, 2)).toEqual(['Ada', 'Alan']);
    table.setSearch('d');
    expect(names(table.rows())).toEqual(['Edsger 10']);
  });
});
