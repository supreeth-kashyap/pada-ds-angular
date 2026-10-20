import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from '@angular/core';
import {
  DsTable,
  DsTableCell,
  DsTableColumnHeader,
  DsTableGrid,
  DsTableResizeHandle,
  DsTableRow,
} from 'pada-ds-angular/headless';
import { PaginationComponent } from '../pagination/pagination';
import { SegmentControlComponent, SegmentOption } from '../segment-control/segment-control';

/**
 * A table of rows and cells on a CSS grid (`role="table"`), with an optional toolbar above and
 * pagination below. Column headers can sort (`aria-sort`), resize (drag the edge, or focus it
 * and press Left/Right) and reorder (drag a header onto another).
 *
 * ```html
 * <ds-table label="Users" [(columns)]="columns">
 *   <ds-table-toolbar>…</ds-table-toolbar>
 *   <ds-table-row>
 *     <ds-table-header-cell columnId="name" label="Name" [sortDirection]="nameSort" (sort)="toggle()" />
 *     <ds-table-header-cell columnId="role" label="Role" />
 *   </ds-table-row>
 *   @for (user of users; track user.id) {
 *     <ds-table-row [selected]="picked.has(user.id)">
 *       <ds-table-cell rowHeader>{{ user.name }}</ds-table-cell>
 *       <ds-table-cell>{{ user.role }}</ds-table-cell>
 *     </ds-table-row>
 *   }
 *   <ds-table-pagination [total]="users.length" [(page)]="page" [(rowsPerPage)]="size" />
 * </ds-table>
 * ```
 *
 * For tables built from data, with sorting, search, selection and paging handled for you, use
 * `ds-data-table`. Differences from React: the toolbar and pagination are the
 * `ds-table-toolbar` and `ds-table-pagination` parts (projected outside the `role="table"`
 * element); `columns` is two-way (`[(columns)]`, React's `onColumnsChange`); cells render in the
 * order they are written instead of being rearranged by `columnId`, so render them with
 * `@for (column of columns)` for column reordering to show.
 */
@Component({
  selector: 'ds-table',
  imports: [DsTableGrid],
  template: `
    <ng-content select="ds-table-toolbar" />
    <div class="table-content">
      <div
        dsTableGrid
        class="table-grid"
        [attr.aria-label]="label() ?? null"
        [attr.aria-labelledby]="labelledBy() ?? null"
      >
        <ng-content />
      </div>
      <ng-content select="ds-table-pagination" />
    </div>
  `,
  styleUrl: './table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsTable, inputs: ['columns'], outputs: ['columnsChange'] }],
})
export class TableComponent {
  /** Accessible name of the table. */
  readonly label = input<string>();
  /** Id of the element that names the table (instead of `label`). */
  readonly labelledBy = input<string>();
}

/** The bar above the table, for search, filters and bulk actions. */
@Component({
  selector: 'ds-table-toolbar',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      padding: var(--pada-space-2) var(--pada-space-3);
      border-bottom: var(--pada-border-width-thin) solid var(--pada-table-border);
    }
  `,
})
export class TableToolbarComponent {}

/** A row. `selected` tints its cells (bulk selection). */
@Component({
  selector: 'ds-table-row',
  template: '<ng-content />',
  styleUrl: './table-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsTableRow, inputs: ['selected'] }],
})
export class TableRowComponent {}

/**
 * A column header. Set `sortDirection` (and handle `sort`) to make the label a sort button and
 * report `aria-sort`. With a `columnId` that is in the table's `columns`, it shows a resize
 * handle and can be dragged onto another header to reorder the columns.
 */
@Component({
  selector: 'ds-table-header-cell',
  imports: [DsTableResizeHandle],
  template: `
    @if (header.sortDirection() !== undefined) {
      <button type="button" class="table-header-cell-sort" (click)="sort.emit()">
        <span class="table-header-cell-label">{{ label() }}</span>
        <svg
          class="table-header-cell-sort-icon"
          viewBox="0 0 16 16"
          width="14"
          height="14"
          aria-hidden="true"
        >
          <path
            d="M8 3v10M4 9l4 4 4-4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    } @else {
      <span class="table-header-cell-label">{{ label() }}</span>
    }
    @if (header.column()) {
      <span
        dsTableResizeHandle
        class="table-header-cell-resizer"
        [attr.aria-label]="'Resize ' + label() + ' column'"
      ></span>
    }
  `,
  styleUrl: './table-header-cell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsTableColumnHeader, inputs: ['columnId', 'sortDirection'] }],
})
export class TableHeaderCellComponent {
  protected readonly header = inject(DsTableColumnHeader);
  /** Column heading. */
  readonly label = input.required<string>();
  /** The sort button was pressed; flip `sortDirection` in response. */
  readonly sort = output<void>();
}

/** A cell. `rowHeader` makes it name its row; `span` stretches it over columns (`'all'`). */
@Component({
  selector: 'ds-table-cell',
  template: '<ng-content />',
  styleUrl: './table-cell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsTableCell, inputs: ['rowHeader', 'span'] }],
})
export class TableCellComponent {}

/** What `ds-table-pagination` reports when the page or page size changes. */
export interface TablePaginationContext {
  /** Active page, from 1. */
  page: number;
  rowsPerPage: number;
  total: number;
  totalPages: number;
  /** First row shown, from 1 (0 when there are none). */
  rangeStart: number;
  /** Last row shown. */
  rangeEnd: number;
}

const paginationContext = (
  page: number,
  rowsPerPage: number,
  total: number,
): TablePaginationContext => ({
  page,
  rowsPerPage,
  total,
  totalPages: Math.max(1, Math.ceil(total / rowsPerPage)),
  rangeStart: total === 0 ? 0 : (page - 1) * rowsPerPage + 1,
  rangeEnd: Math.min(page * rowsPerPage, total),
});

/**
 * Paging under a table: a rows-per-page picker, the visible range ("1-25 of 120") and page
 * navigation. Picking a page size goes back to page 1.
 *
 * Differences from React: page navigation is `ds-pagination` (numbered pages between Previous
 * and Next, rather than only the two chevrons); `page` and `rowsPerPage` are two-way, and
 * `paginationChange` carries React's context payload.
 */
@Component({
  selector: 'ds-table-pagination',
  imports: [PaginationComponent, SegmentControlComponent],
  template: `
    <div class="table-pagination-start">
      <span class="table-pagination-label" aria-hidden="true">Show</span>
      <ds-segment-control
        aria-label="Rows per page"
        [options]="sizeOptions()"
        [value]="'' + rowsPerPage()"
        (valueChange)="setRowsPerPage($event)"
      />
    </div>
    <div class="table-pagination-end">
      <span class="table-pagination-range">
        {{ context().rangeStart }}-{{ context().rangeEnd }} of {{ total() }}
      </span>
      <ds-pagination
        label="Table pages"
        [page]="page()"
        [totalPages]="context().totalPages"
        (pageChange)="setPage($event)"
      />
    </div>
  `,
  styleUrl: './table-pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablePaginationComponent {
  /** Total number of rows across all pages. */
  readonly total = input.required({ transform: numberAttribute });
  /** Active page, from 1. Two-way bindable: `[(page)]`. */
  readonly page = model(1);
  /** Rows per page. Two-way bindable: `[(rowsPerPage)]`. */
  readonly rowsPerPage = model(25);
  /** Page sizes offered. @default [25, 50, 100] */
  readonly rowsPerPageOptions = input<readonly number[]>([25, 50, 100]);
  /** The page or page size changed, with the resulting range. */
  readonly paginationChange = output<TablePaginationContext>();

  protected readonly context = computed(() =>
    paginationContext(this.page(), this.rowsPerPage(), this.total()),
  );
  protected readonly sizeOptions = computed<SegmentOption[]>(() =>
    this.rowsPerPageOptions().map((size) => ({ value: String(size), label: String(size) })),
  );

  protected setPage(page: number) {
    this.page.set(page);
    this.paginationChange.emit(paginationContext(page, this.rowsPerPage(), this.total()));
  }

  protected setRowsPerPage(value: string | null) {
    const size = Number(value);
    if (!size || size === this.rowsPerPage()) return;
    // A new page size starts from the first page, so it never lands past the end.
    this.rowsPerPage.set(size);
    this.page.set(1);
    this.paginationChange.emit(paginationContext(1, size, this.total()));
  }
}

/** Every table part, for `imports: [...TableParts]`. */
export const TableParts = [
  TableComponent,
  TableToolbarComponent,
  TableRowComponent,
  TableHeaderCellComponent,
  TableCellComponent,
  TablePaginationComponent,
] as const;
