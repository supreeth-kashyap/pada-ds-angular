import { computed, signal, Signal, WritableSignal } from '@angular/core';

export type DataTableSortDirection = 'ascending' | 'descending';

export interface DataTableSort {
  columnId: string;
  direction: DataTableSortDirection;
}

export interface DataTableColumnDef<T> {
  id: string;
  /** The value sorted and searched on: a key of the row or a function. @default row[id] */
  accessor?: keyof T | ((row: T) => unknown);
  /** @default true */
  sortable?: boolean;
  /** Custom comparison for ascending order. */
  sortFn?: (a: T, b: T) => number;
  /** Include the column in the global search. @default true */
  searchable?: boolean;
  /** Let people hide the column. @default true */
  hideable?: boolean;
}

export interface DataTableRow<T> {
  id: string;
  index: number;
  original: T;
}

/** What `createDataTable` reads. Functions and signals are read reactively. */
export interface DataTableOptions<T> {
  data: () => readonly T[];
  columns: () => readonly DataTableColumnDef<T>[];
  /** Stable id per row, for selection. @default row.id, else the index */
  getRowId?: () => ((row: T, index: number) => string) | undefined;
  /** Custom search match. @default case-insensitive "contains" over searchable columns */
  searchFn?: () => ((row: T, query: string) => boolean) | undefined;
  /**
   * The data is already sorted, searched and paged (by a server): only selection, column
   * visibility and the state signals apply. Pass `rowCount` for the total.
   */
  manual?: () => boolean;
  /** Total rows across all pages, when `manual`. */
  rowCount?: () => number | undefined;
  // State. Pass your own signals (a component's `model()`s) to control it; each one is created
  // when omitted.
  sort?: WritableSignal<DataTableSort | null>;
  search?: WritableSignal<string>;
  selectedIds?: WritableSignal<readonly string[]>;
  hiddenColumns?: WritableSignal<readonly string[]>;
  /** Current page, starting at 1. */
  page?: WritableSignal<number>;
  /** Rows per page; unset (`undefined`) falls back to `defaultPageSize`. */
  pageSize?: WritableSignal<number | undefined>;
  /** Rows per page while `pageSize` is unset. @default 10 */
  defaultPageSize?: () => number;
}

export type DataTablePageSelection = 'all' | 'some' | 'none';

/** The table state and derived rows `createDataTable` returns. */
export interface DataTableState<T> {
  /** The rows to render: searched, sorted and paged. */
  readonly rows: Signal<readonly DataTableRow<T>[]>;
  /** Rows across all pages (after the search). */
  readonly total: Signal<number>;
  readonly pageCount: Signal<number>;
  /** The page shown, clamped to the page count. */
  readonly currentPage: Signal<number>;
  readonly visibleColumns: Signal<readonly DataTableColumnDef<T>[]>;
  readonly selectedRows: Signal<readonly T[]>;
  readonly pageSelection: Signal<DataTablePageSelection>;
  readonly sort: WritableSignal<DataTableSort | null>;
  readonly search: WritableSignal<string>;
  readonly selectedIds: WritableSignal<readonly string[]>;
  readonly hiddenColumns: WritableSignal<readonly string[]>;
  readonly page: WritableSignal<number>;
  /** Rows per page in effect. Change it with `setPageSize`. */
  readonly pageSize: Signal<number>;
  getSortDirection(columnId: string): DataTableSortDirection | 'none';
  /** Cycles a column through ascending, descending and unsorted. */
  toggleSort(columnId: string): void;
  /** Sets the search and goes back to the first page. */
  setSearch(search: string): void;
  setPage(page: number): void;
  /** Sets the page size and goes back to the first page. */
  setPageSize(pageSize: number): void;
  isSelected(id: string): boolean;
  toggleRow(id: string): void;
  /** Selects every row on the page, or clears them when they are all selected. */
  togglePage(): void;
  clearSelection(): void;
  isColumnVisible(columnId: string): boolean;
  toggleColumn(columnId: string): void;
}

const read = <T>(row: T, column: DataTableColumnDef<T>): unknown =>
  typeof column.accessor === 'function'
    ? column.accessor(row)
    : (row as Record<string, unknown>)[(column.accessor as string | undefined) ?? column.id];

/** The value a column reads from a row: its accessor, or `row[column.id]`. */
export const readDataTableValue = read;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const isBlank = (value: unknown) => value === null || value === undefined || value === '';

/** Text a cell value is searched by: dates as YYYY-MM-DD, everything else as a string. */
const searchText = (value: unknown) =>
  (value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '')).toLowerCase();

/** Ascending order for mixed cell values: numbers and dates by value, text naturally, blanks last. */
export function compareValues(a: unknown, b: unknown): number {
  if (isBlank(a) || isBlank(b)) return isBlank(a) === isBlank(b) ? 0 : isBlank(a) ? 1 : -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return collator.compare(String(a), String(b));
}

/**
 * State and derived rows for a data table: sorting, global search, row selection, column
 * visibility and paging. Renders nothing; pair it with your own `dsTable` markup or use the
 * styled `ds-data-table`. Works anywhere signals do (no injection context needed).
 *
 * ```ts
 * readonly table = createDataTable({ data: () => this.members(), columns: () => COLUMNS });
 * // table.rows(), table.toggleSort('name'), table.setSearch('ada'), table.togglePage() …
 * ```
 *
 * The Angular twin of React's `useDataTable`: controlled state is a signal you pass in
 * (`sort: this.sort`) instead of a value and a callback.
 */
export function createDataTable<T>(options: DataTableOptions<T>): DataTableState<T> {
  const sort = options.sort ?? signal<DataTableSort | null>(null);
  const search = options.search ?? signal('');
  const selectedIds = options.selectedIds ?? signal<readonly string[]>([]);
  const hiddenColumns = options.hiddenColumns ?? signal<readonly string[]>([]);
  const page = options.page ?? signal(1);
  const pageSizeState = options.pageSize ?? signal<number | undefined>(undefined);
  const pageSize = computed(() => pageSizeState() ?? options.defaultPageSize?.() ?? 10);
  const manual = () => options.manual?.() ?? false;

  const allRows = computed<DataTableRow<T>[]>(() => {
    const getRowId = options.getRowId?.();
    return options.data().map((row, index) => ({
      id: getRowId?.(row, index) ?? String((row as { id?: unknown }).id ?? index),
      index,
      original: row,
    }));
  });

  const processed = computed(() => {
    let rows = allRows();
    if (manual()) return rows;
    const columns = options.columns();
    const query = search().trim().toLowerCase();
    if (query) {
      const searchFn = options.searchFn?.();
      const searchable = columns.filter((column) => column.searchable !== false);
      rows = rows.filter(({ original }) =>
        searchFn
          ? searchFn(original, query)
          : searchable.some((column) => searchText(read(original, column)).includes(query)),
      );
    }
    const current = sort();
    const column = current && columns.find((candidate) => candidate.id === current.columnId);
    if (current && column) {
      const factor = current.direction === 'ascending' ? 1 : -1;
      const compare = (a: T, b: T) => {
        if (column.sortFn) return column.sortFn(a, b) * factor;
        const [first, second] = [read(a, column), read(b, column)];
        // Blank cells stay at the end in both directions.
        if (isBlank(first) || isBlank(second)) return compareValues(first, second);
        return compareValues(first, second) * factor;
      };
      // Stable: ties keep their original order.
      rows = [...rows].sort((a, b) => compare(a.original, b.original) || a.index - b.index);
    }
    return rows;
  });

  const total = computed(() =>
    manual() ? (options.rowCount?.() ?? allRows().length) : processed().length,
  );
  const pageCount = computed(() => Math.max(1, Math.ceil(total() / pageSize())));
  const currentPage = computed(() => Math.min(Math.max(1, page()), pageCount()));
  const rows = computed(() => {
    if (manual()) return processed();
    const size = pageSize();
    const start = (currentPage() - 1) * size;
    return processed().slice(start, start + size);
  });

  const selectedSet = computed(() => new Set(selectedIds()));
  const pageIds = computed(() => rows().map((row) => row.id));
  const pageSelection = computed<DataTablePageSelection>(() => {
    const ids = pageIds();
    const selectedOnPage = ids.filter((id) => selectedSet().has(id)).length;
    return ids.length > 0 && selectedOnPage === ids.length
      ? 'all'
      : selectedOnPage > 0
        ? 'some'
        : 'none';
  });
  const selectedRows = computed(() =>
    allRows()
      .filter((row) => selectedSet().has(row.id))
      .map((row) => row.original),
  );
  const hiddenSet = computed(() => new Set(hiddenColumns()));
  const visibleColumns = computed(() =>
    options.columns().filter((column) => !hiddenSet().has(column.id)),
  );

  const getSortDirection = (columnId: string): DataTableSortDirection | 'none' => {
    const current = sort();
    return current?.columnId === columnId ? current.direction : 'none';
  };

  return {
    rows,
    total,
    pageCount,
    currentPage,
    visibleColumns,
    selectedRows,
    pageSelection,
    sort,
    search,
    selectedIds,
    hiddenColumns,
    page,
    pageSize,
    getSortDirection,
    toggleSort(columnId) {
      const current = getSortDirection(columnId);
      sort.set(
        current === 'none'
          ? { columnId, direction: 'ascending' }
          : current === 'ascending'
            ? { columnId, direction: 'descending' }
            : null,
      );
    },
    setSearch(next) {
      search.set(next);
      // A new search starts from its first page.
      page.set(1);
    },
    setPage(next) {
      page.set(Math.max(1, next));
    },
    setPageSize(next) {
      pageSizeState.set(next);
      page.set(1);
    },
    isSelected: (id) => selectedSet().has(id),
    toggleRow(id) {
      const ids = selectedIds();
      selectedIds.set(ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
    },
    togglePage() {
      const ids = pageIds();
      selectedIds.set(
        pageSelection() === 'all'
          ? selectedIds().filter((id) => !ids.includes(id))
          : [...new Set([...selectedIds(), ...ids])],
      );
    },
    clearSelection() {
      selectedIds.set([]);
    },
    isColumnVisible: (columnId) => !hiddenSet().has(columnId),
    toggleColumn(columnId) {
      const hidden = hiddenColumns();
      hiddenColumns.set(
        hidden.includes(columnId) ? hidden.filter((id) => id !== columnId) : [...hidden, columnId],
      );
    },
  };
}
