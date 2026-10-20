import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  model,
  signal,
  TemplateRef,
  untracked,
} from '@angular/core';
import {
  createDataTable,
  DataTableColumnDef,
  DataTableSort,
  DsVisuallyHidden,
  readDataTableValue,
  TableColumn,
  TableSortDirection,
} from 'pada-ds-angular/headless';
import { ButtonComponent } from '../button/button';
import { CheckboxComponent } from '../checkbox/checkbox';
import { DropdownMenuParts } from '../dropdown-menu/dropdown-menu';
import { SearchFieldComponent } from '../search-field/search-field';
import { TableParts } from '../table/table';

/** A column of a `ds-data-table`. */
export interface DataTableColumn<T> extends DataTableColumnDef<T> {
  /** Column heading. */
  header: string;
  /** Width in px; columns without one share the remaining space. */
  width?: number;
  minWidth?: number;
  /** Cells in this column name their row (`role="rowheader"`), e.g. a name column. */
  rowHeader?: boolean;
}

/** What `ds-data-table` renders. */
export interface DataTableData<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Total rows across all pages, for `manual` (server-side) tables. @default rows.length */
  rowCount?: number;
}

/**
 * A custom cell for one column. The context is the row (`let-row`) and its value (`let-value="value"`).
 *
 * ```html
 * <ng-template dsDataTableCell="status" let-row><ds-badge>{{ row.status }}</ds-badge></ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[dsDataTableCell]' })
export class DataTableCellDirective {
  /** The id of the column this template renders. */
  readonly columnId = input.required<string>({ alias: 'dsDataTableCell' });
  readonly template = inject<TemplateRef<{ $implicit: unknown; value: unknown }>>(TemplateRef);
}

/**
 * Toolbar content at the end, e.g. bulk actions. The context is the selected rows (`let-rows`).
 *
 * ```html
 * <ng-template dsDataTableActions let-rows>
 *   @if (rows.length) { <button dsButton size="sm" (click)="remove(rows)">Remove {{ rows.length }}</button> }
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[dsDataTableActions]' })
export class DataTableActionsDirective {
  readonly template = inject<TemplateRef<{ $implicit: readonly unknown[] }>>(TemplateRef);
}

/** Shown when there are no rows, or none match the search, instead of the built-in message. */
@Directive({ selector: 'ng-template[dsDataTableEmpty]' })
export class DataTableEmptyDirective {
  readonly template = inject<TemplateRef<{ $implicit: string }>>(TemplateRef);
}

const SELECT_COLUMN = '__select';

/**
 * A table built from data: sortable headers, search, row selection, column visibility and
 * paging, on top of `ds-table`. Every piece of state is two-way bindable, and `manual` hands
 * sorting, search and paging to a server.
 *
 * ```html
 * <ds-data-table label="Team members" [data]="toDataTableData(response, columns)" selectable
 *                [(selectedIds)]="selected">
 *   <ng-template dsDataTableCell="commits" let-row><strong>{{ row.commits }}</strong></ng-template>
 *   <ng-template dsDataTableActions let-rows>…</ng-template>
 * </ds-data-table>
 * ```
 *
 * State (all `model()`s): `sort`, `search`, `selectedIds`, `hiddenColumns`, `page`, `pageSize`.
 * For the logic without the markup, use `createDataTable` from `pada-ds-angular/headless`.
 *
 * Differences from React: columns and rows come in one `data` input (`{ columns, rows,
 * rowCount }`, with `toDataTableData` to adapt an API response); custom cells, toolbar actions
 * and the empty state are `ng-template`s (`dsDataTableCell`, `dsDataTableActions`,
 * `dsDataTableEmpty`) instead of render functions; controlled state is `[(…)]` instead of
 * value-and-callback pairs; the pager is `ds-table-pagination`, so it has numbered pages.
 */
@Component({
  selector: 'ds-data-table',
  imports: [
    ...TableParts,
    ...DropdownMenuParts,
    ButtonComponent,
    CheckboxComponent,
    DsVisuallyHidden,
    NgTemplateOutlet,
    SearchFieldComponent,
  ],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T> {
  /** The columns and rows. */
  readonly data = input.required<DataTableData<T>>();
  /** Accessible name of the table, e.g. "Team members". */
  readonly label = input.required<string>();
  /** Adds a checkbox column for selecting rows. */
  readonly selectable = input(false, { transform: booleanAttribute });
  /** Shows a search field that filters every searchable column. @default true */
  readonly searchable = input(true, { transform: booleanAttribute });
  /** @default 'Search' */
  readonly searchPlaceholder = input('Search');
  /** Shows a "Columns" menu for hiding columns. @default true */
  readonly columnToggle = input(true, { transform: booleanAttribute });
  /** Page sizes offered under the table. @default [10, 25, 50] */
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50]);
  /**
   * The rows are already sorted, searched and paged (by a server): only selection and column
   * visibility apply here. React to the state changes and pass `rowCount` in `data`.
   */
  readonly manual = input(false, { transform: booleanAttribute });
  /** Stable id per row, for selection. @default row.id, else the index */
  readonly getRowId = input<(row: T, index: number) => string>();
  /** Custom search match. @default case-insensitive "contains" over searchable columns */
  readonly searchFn = input<(row: T, query: string) => boolean>();

  /** The sorted column and direction, or null. Two-way bindable. */
  readonly sort = model<DataTableSort | null>(null);
  /** Global search text. Two-way bindable. */
  readonly search = model('');
  /** Ids of the selected rows. Two-way bindable. */
  readonly selectedIds = model<readonly string[]>([]);
  /** Ids of hidden columns. Two-way bindable. */
  readonly hiddenColumns = model<readonly string[]>([]);
  /** Current page, from 1. Two-way bindable. */
  readonly page = model(1);
  /** Rows per page. Two-way bindable. @default the first of `pageSizeOptions` */
  readonly pageSize = model<number | undefined>(undefined);

  protected readonly cellTemplates = contentChildren(DataTableCellDirective);
  protected readonly actions = contentChild(DataTableActionsDirective);
  protected readonly empty = contentChild(DataTableEmptyDirective);

  protected readonly table = createDataTable<T>({
    data: () => this.data().rows,
    columns: () => this.data().columns,
    getRowId: () => this.getRowId(),
    searchFn: () => this.searchFn(),
    manual: () => this.manual(),
    rowCount: () => this.data().rowCount,
    sort: this.sort,
    search: this.search,
    selectedIds: this.selectedIds,
    hiddenColumns: this.hiddenColumns,
    page: this.page,
    pageSize: this.pageSize,
    defaultPageSize: () => this.pageSizeOptions()[0] ?? 10,
  });

  private readonly visible = computed(
    () => this.table.visibleColumns() as readonly DataTableColumn<T>[],
  );

  /** The table's columns, kept equal while the columns are, so widths survive re-renders. */
  protected readonly tableColumns = computed<TableColumn[]>(
    () => [
      ...(this.selectable()
        ? [{ id: SELECT_COLUMN, label: 'Select', width: 44, minWidth: 44 }]
        : []),
      ...this.visible().map((column) => ({
        id: column.id,
        label: column.header,
        width: column.width,
        minWidth: column.minWidth,
      })),
    ],
    { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
  );

  protected readonly headers = computed(() =>
    this.visible().map((column) => ({
      id: column.id,
      header: column.header,
      sortDirection: (column.sortable === false
        ? undefined
        : this.table.getSortDirection(column.id)) as TableSortDirection | undefined,
    })),
  );

  protected readonly bodyRows = computed(() => {
    const visible = this.visible();
    const templates = new Map(this.cellTemplates().map((cell) => [cell.columnId(), cell.template]));
    const nameColumn = visible.find((column) => column.rowHeader) ?? visible[0];
    const selected = new Set(this.selectedIds());
    return this.table.rows().map((row) => {
      const name = nameColumn ? readDataTableValue(row.original, nameColumn) : undefined;
      return {
        id: row.id,
        selected: selected.has(row.id),
        selectLabel: `Select ${String(name ?? row.id)}`,
        cells: visible.map((column) => {
          const value = readDataTableValue(row.original, column);
          return {
            id: column.id,
            rowHeader: !!column.rowHeader,
            text: String(value ?? ''),
            template: templates.get(column.id) ?? null,
            context: { $implicit: row.original, value },
          };
        }),
      };
    });
  });

  protected readonly hideable = computed(() => {
    const hidden = new Set(this.hiddenColumns());
    return this.data()
      .columns.filter((column) => column.hideable !== false)
      .map((column) => ({ id: column.id, header: column.header, visible: !hidden.has(column.id) }));
  });

  protected readonly selectedCount = computed(() => this.selectedIds().length);
  protected readonly actionsContext = computed(() => ({ $implicit: this.table.selectedRows() }));
  protected readonly emptyMessage = computed(() => {
    const search = this.search();
    return search ? `No results for “${search}”` : 'No data';
  });
  protected readonly showPagination = computed(
    () => this.table.total() > Math.min(...this.pageSizeOptions()),
  );

  /** Announces how many rows match, once the search settles. */
  protected readonly announcement = signal('');

  constructor() {
    let first = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    effect(() => {
      this.search();
      const total = this.table.total();
      if (first) {
        first = false;
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(
        () =>
          untracked(() => this.announcement.set(`${total} ${total === 1 ? 'result' : 'results'}`)),
        400,
      );
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(timer));
  }
}

/** The data table and its templates, for `imports: [...DataTableParts]`. */
export const DataTableParts = [
  DataTableComponent,
  DataTableCellDirective,
  DataTableActionsDirective,
  DataTableEmptyDirective,
] as const;
