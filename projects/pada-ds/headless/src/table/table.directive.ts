import {
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { dataFlag } from '../utils/dom';

/** A column of a table: its id, its heading, and an optional fixed width. */
export interface TableColumn {
  id: string;
  label: string;
  /** Width in px; columns without one share the remaining space. */
  width?: number;
  /** Smallest width a resize can reach, in px. @default 80 */
  minWidth?: number;
}

/** `aria-sort` values of a sortable column header. */
export type TableSortDirection = 'ascending' | 'descending' | 'none';

const DEFAULT_MIN_WIDTH = 80;
const RESIZE_STEP = 16;

/**
 * Holds a table's columns (order and widths) for its rows, headers and resize handles. Rows lay
 * their cells out on a CSS grid built from the columns. Renders nothing; put `dsTableGrid` on
 * the element that should be the `role="table"` (often the same one).
 *
 * ```html
 * <div dsTable dsTableGrid [(columns)]="columns" aria-label="Users">
 *   <div dsTableRow>
 *     <div dsTableColumnHeader columnId="name" [sortDirection]="sort">
 *       <button type="button" (click)="toggleSort()">Name</button>
 *       <span dsTableResizeHandle aria-label="Resize Name column"></span>
 *     </div>
 *   </div>
 *   <div dsTableRow><div dsTableCell rowHeader>Ada</div></div>
 * </div>
 * ```
 *
 * Columns resized or reordered (by dragging one header onto another) come out of
 * `columnsChange`. Cells render in the order they are written, so render them with
 * `@for (column of columns)` for reordering to show.
 */
@Directive({ selector: '[dsTable]', exportAs: 'dsTable' })
export class DsTable {
  /** The columns, in display order. Two-way bindable: `[(columns)]`. */
  readonly columns = model<readonly TableColumn[]>([]);

  /** The rows' `grid-template-columns`: fixed widths in px, the rest share the space. */
  readonly gridTemplate = computed(() =>
    this.columns()
      .map((column) => (column.width ? `${column.width}px` : 'minmax(0, 1fr)'))
      .join(' '),
  );

  column(id: string) {
    return this.columns().find((column) => column.id === id);
  }

  /** Sets a column's width, never below its `minWidth`. */
  setColumnWidth(id: string, width: number) {
    this.columns.update((columns) =>
      columns.map((column) =>
        column.id === id
          ? { ...column, width: Math.round(Math.max(column.minWidth ?? DEFAULT_MIN_WIDTH, width)) }
          : column,
      ),
    );
  }

  /** Moves the column `sourceId` to where `targetId` is. */
  moveColumn(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const columns = [...this.columns()];
    const from = columns.findIndex((column) => column.id === sourceId);
    const to = columns.findIndex((column) => column.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = columns.splice(from, 1);
    columns.splice(to, 0, moved);
    this.columns.set(columns);
  }
}

/** The `role="table"` element. Name it with `aria-label` or `aria-labelledby`. */
@Directive({ selector: '[dsTableGrid]', host: { role: 'table' } })
export class DsTableGrid {}

/**
 * A row (`role="row"`). Inside a `dsTable` it lays its cells out on the columns' grid. A
 * `selected` row gets `aria-selected` and `data-selected`.
 */
@Directive({
  selector: '[dsTableRow]',
  host: {
    role: 'row',
    '[style.grid-template-columns]': 'table?.gridTemplate() || null',
    '[attr.aria-selected]': 'selected() || null',
    '[attr.data-selected]': 'selectedFlag()',
  },
})
export class DsTableRow {
  protected readonly table = inject(DsTable, { optional: true });
  /** Shows the row as selected (bulk selection). */
  readonly selected = input(false, { transform: booleanAttribute });
  protected readonly selectedFlag = computed(() => dataFlag(this.selected()));
}

/**
 * A column header (`role="columnheader"`). Set `sortDirection` on a sortable column: it reports
 * `aria-sort` and `data-sort`. Inside a `dsTable`, with a `columnId`, it can be dragged onto
 * another header to reorder the columns.
 */
@Directive({
  selector: '[dsTableColumnHeader]',
  exportAs: 'dsTableColumnHeader',
  host: {
    role: 'columnheader',
    '[attr.aria-sort]': 'sortDirection() ?? null',
    '[attr.data-sort]': 'sortDirection() ?? null',
    '[attr.draggable]': 'reorderable() ? "true" : null',
    '(dragstart)': 'onDragStart($event)',
    '(dragover)': 'onDragOver($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class DsTableColumnHeader {
  protected readonly table = inject(DsTable, { optional: true });
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** The column this header belongs to, for resizing and reordering. */
  readonly columnId = input<string>();
  /** Current sort of a sortable column. Leave unset for a column that does not sort. */
  readonly sortDirection = input<TableSortDirection>();

  /** The column's state in the table, when there is one. */
  readonly column = computed(() => {
    const id = this.columnId();
    return id === undefined ? undefined : this.table?.column(id);
  });
  protected readonly reorderable = computed(() => !!this.column());

  protected onDragStart(event: DragEvent) {
    const id = this.columnId();
    if (!this.column() || id === undefined) return;
    event.dataTransfer?.setData('text/plain', id);
  }
  protected onDragOver(event: DragEvent) {
    if (this.column()) event.preventDefault();
  }
  protected onDrop(event: DragEvent) {
    const id = this.columnId();
    const source = event.dataTransfer?.getData('text/plain');
    if (!this.column() || id === undefined || !source) return;
    event.preventDefault();
    this.table?.moveColumn(source, id);
  }
}

/**
 * A cell (`role="cell"`, or `role="rowheader"` with `rowHeader`). `span` stretches it over
 * several columns, or all of them (`'all'`), e.g. for an empty-state message.
 */
@Directive({
  selector: '[dsTableCell]',
  host: {
    '[attr.role]': 'rowHeader() ? "rowheader" : "cell"',
    '[style.grid-column]': 'gridColumn()',
  },
})
export class DsTableCell {
  /** Marks the cell as the header of its row, e.g. a name column. */
  readonly rowHeader = input(false, { transform: booleanAttribute });
  /** Columns the cell spans. */
  readonly span = input<number | 'all'>();
  protected readonly gridColumn = computed(() => {
    const span = this.span();
    return span === undefined ? null : span === 'all' ? '1 / -1' : `span ${span}`;
  });
}

/**
 * The resize handle of a column header (`role="separator"`, focusable). Drag it, or press
 * Left/Right while it has focus, to resize the column; `aria-valuenow` is the width in px. Put
 * it inside a `dsTableColumnHeader` whose column is in the `dsTable`, and give it an
 * `aria-label` such as "Resize Name column".
 */
@Directive({
  selector: '[dsTableResizeHandle]',
  host: {
    role: 'separator',
    tabindex: '0',
    'aria-orientation': 'vertical',
    draggable: 'false',
    '[attr.aria-valuenow]': 'width()',
    '[attr.aria-valuemin]': 'minWidth()',
    '(keydown)': 'onKeyDown($event)',
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class DsTableResizeHandle {
  private readonly table = inject(DsTable);
  private readonly header = inject(DsTableColumnHeader);
  // Columns without a set width are `1fr`; track the rendered width so resizing starts from it.
  private readonly measured = signal(0);

  protected readonly minWidth = computed(() => this.header.column()?.minWidth ?? DEFAULT_MIN_WIDTH);
  /** Current width in px. */
  readonly width = computed(() => Math.round(this.header.column()?.width ?? this.measured()));

  constructor() {
    const cell = this.header.element;
    effect((onCleanup) => {
      this.measured.set(cell.offsetWidth);
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.measured.set(cell.offsetWidth));
      observer.observe(cell);
      onCleanup(() => observer.disconnect());
    });
    inject(DestroyRef).onDestroy(() => this.stopDrag?.());
  }

  private stopDrag?: () => void;

  private resize(width: number) {
    const id = this.header.columnId();
    if (id !== undefined) this.table.setColumnWidth(id, width);
  }

  protected onKeyDown(event: KeyboardEvent) {
    const delta = ({ ArrowLeft: -RESIZE_STEP, ArrowRight: RESIZE_STEP } as Record<string, number>)[
      event.key
    ];
    if (delta === undefined) return;
    event.preventDefault();
    this.resize(this.width() + delta);
  }

  protected onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = this.header.column()?.width ?? this.header.element.offsetWidth;
    const view = this.header.element.ownerDocument.defaultView ?? window;
    const move = (moveEvent: PointerEvent) => this.resize(startWidth + moveEvent.clientX - startX);
    const stop = () => {
      view.removeEventListener('pointermove', move);
      view.removeEventListener('pointerup', stop);
      this.stopDrag = undefined;
    };
    view.addEventListener('pointermove', move);
    view.addEventListener('pointerup', stop);
    this.stopDrag = stop;
  }
}

/** Every table part, for `imports: [...DsTableParts]`. */
export const DsTableParts = [
  DsTable,
  DsTableGrid,
  DsTableRow,
  DsTableColumnHeader,
  DsTableCell,
  DsTableResizeHandle,
] as const;
