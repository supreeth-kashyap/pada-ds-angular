import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import { LayoutSpace, layoutSpaceToken, toLayoutSpace } from '../stack/stack';

export type GridAlign = 'start' | 'center' | 'end' | 'stretch';

/**
 * CSS grid layout with token gaps: a fixed number of columns, or as many as fit
 * (`minItemWidth`), responsive without breakpoints. Use the element, or put `dsGrid` on the
 * element you need (React's `as` prop):
 *
 * ```html
 * <ds-grid columns="3" gap="2">…</ds-grid>
 * <ul dsGrid minItemWidth="16rem">…</ul>
 * ```
 */
@Component({
  selector: 'ds-grid, [dsGrid]',
  template: '<ng-content />',
  styleUrl: './grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-align]': 'align() ?? null',
    '[attr.data-fit]': 'minItemWidth() ? "" : null',
    '[style.--pada-grid-columns]': 'columns()',
    '[style.--pada-grid-gap]': 'gapToken()',
    '[style.--pada-grid-row-gap]': 'rowGapToken()',
    '[style.--pada-grid-min-item-width]': 'minItemWidth() || null',
  },
})
export class GridComponent {
  /** Fixed number of equal columns. Ignored when `minItemWidth` is set. @default 1 */
  readonly columns = input(1, { transform: numberAttribute });
  /**
   * Fit as many columns as there is room for, each at least this wide (`240px`, `16rem`).
   * Responsive without breakpoints.
   */
  readonly minItemWidth = input<string>();
  /** Gap in spacing steps, like Stack: `gap="4"` is 16px at default density. @default 4 */
  readonly gap = input<LayoutSpace, LayoutSpace | `${LayoutSpace}`>(4, {
    transform: toLayoutSpace,
  });
  /** Row gap, when it differs from `gap`. */
  readonly rowGap = input<LayoutSpace | undefined, LayoutSpace | `${LayoutSpace}` | undefined>(
    undefined,
    { transform: (value) => (value === undefined ? undefined : toLayoutSpace(value)) },
  );
  /** Cross-axis alignment of items. */
  readonly align = input<GridAlign>();

  protected readonly gapToken = computed(() => layoutSpaceToken(this.gap()));
  protected readonly rowGapToken = computed(() => layoutSpaceToken(this.rowGap() ?? this.gap()));
}
