import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SkeletonShape = 'text' | 'rect' | 'circle';

const cssSize = (value: number | string | undefined) =>
  typeof value === 'number' ? `${value}px` : (value ?? null);

/**
 * A placeholder that shimmers while content loads. Hidden from assistive technology: mark the
 * loading region with `aria-busy` instead.
 *
 * ```html
 * <section aria-busy="true">
 *   <ds-skeleton shape="circle" [width]="40" />
 *   <ds-skeleton [lines]="3" />
 * </section>
 * ```
 *
 * With several `lines`, the host holds one placeholder per line; the last one is shorter.
 */
@Component({
  selector: 'ds-skeleton',
  template: `
    @if (lineCount() > 1) {
      @for (line of lineList(); track line) {
        <span class="skeleton" data-shape="text" [attr.data-last]="$last ? '' : null"></span>
      }
    }
  `,
  styleUrl: './skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[attr.data-shape]': 'shape()',
    '[attr.data-lines]': 'lineCount() > 1 ? lineCount() : null',
    '[style.--pada-skeleton-width]': 'widthValue()',
    '[style.--pada-skeleton-height]': 'heightValue()',
  },
})
export class SkeletonComponent {
  /** `text` (a line of text), `rect` (a block) or `circle` (an avatar). @default 'text' */
  readonly shape = input<SkeletonShape>('text');
  /** CSS width (numbers are px). Text lines default to 100%; circles to their height. */
  readonly width = input<number | string>();
  /** CSS height (numbers are px). */
  readonly height = input<number | string>();
  /** For `text`: the number of lines; the last one is shorter. @default 1 */
  readonly lines = input(1);

  protected readonly widthValue = computed(() => cssSize(this.width()));
  protected readonly heightValue = computed(() => cssSize(this.height()));
  protected readonly lineCount = computed(() => (this.shape() === 'text' ? this.lines() : 1));
  protected readonly lineList = computed(() =>
    Array.from({ length: this.lineCount() }, (_, index) => index),
  );
}
