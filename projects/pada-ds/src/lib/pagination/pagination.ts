import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { IconComponent } from '../icon/icon';
import { paginationRange } from './pagination-range';

export { paginationRange, type PaginationEntry } from './pagination-range';

/**
 * Page navigation: previous, numbered pages with ellipses, next. The current page has
 * `aria-current="page"`; previous and next are disabled at the ends.
 *
 * ```html
 * <ds-pagination [(page)]="page" [totalPages]="20" />
 * ```
 *
 * Unlike React (`page` + `onPageChange`), `page` is a two-way `model`; one-way `[page]` with
 * `(pageChange)` works too.
 */
@Component({
  selector: 'ds-pagination',
  imports: [IconComponent],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  /** Current page, starting at 1. Two-way bindable: `[(page)]`. */
  readonly page = model.required<number>();
  /** Number of pages. */
  readonly totalPages = input.required({ transform: numberAttribute });
  /** Pages shown on each side of the current one. @default 1 */
  readonly siblingCount = input(1, { transform: numberAttribute });
  /** Pages always shown at each end. @default 1 */
  readonly boundaryCount = input(1, { transform: numberAttribute });
  /** Accessible name of the navigation landmark. @default 'Pagination' */
  readonly label = input('Pagination');

  protected readonly entries = computed(() =>
    paginationRange(this.page(), this.totalPages(), this.siblingCount(), this.boundaryCount()),
  );
  protected readonly atStart = computed(() => this.page() <= 1);
  protected readonly atEnd = computed(() => this.page() >= this.totalPages());

  protected go(page: number) {
    this.page.set(page);
  }
}
