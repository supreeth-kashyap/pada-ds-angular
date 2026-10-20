import type { DataTableColumn, DataTableData } from './data-table';

/**
 * A list response as APIs commonly return it: the rows (or none) and, for paged endpoints, the
 * total across all pages. A bare array works too.
 */
export type DataTableApiResponse<T> =
  | readonly T[]
  | { items?: readonly T[] | null; total?: number | null }
  | null
  | undefined;

/** A column before defaults: the header falls back to the id ("createdAt" → "Created at"). */
export type DataTableColumnInput<T> = Omit<DataTableColumn<T>, 'header'> & { header?: string };

const headerFromId = (id: string) => {
  const words = id
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * Maps an API list response and column definitions to `ds-data-table` data: rows default to
 * none, `rowCount` comes from the response's `total` (for server-side paging), and columns
 * without a header get one from their id.
 */
export function toDataTableData<T>(
  response: DataTableApiResponse<T>,
  columns: readonly DataTableColumnInput<T>[],
): DataTableData<T> {
  const list = Array.isArray(response)
    ? { items: response as readonly T[], total: null }
    : ((response ?? {}) as { items?: readonly T[] | null; total?: number | null });
  const rows = [...(list.items ?? [])];
  return {
    columns: columns.map((column) => ({
      ...column,
      header: column.header ?? headerFromId(column.id),
    })),
    rows,
    ...(typeof list.total === 'number' ? { rowCount: list.total } : {}),
  };
}
