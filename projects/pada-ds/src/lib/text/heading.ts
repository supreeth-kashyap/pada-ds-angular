import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input } from '@angular/core';
import type { TextSize, TextWeight } from './text';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** The type-scale size each heading level gets unless `size` says otherwise. */
const LEVEL_SIZES: Record<HeadingLevel, TextSize> = {
  1: '3xl',
  2: '2xl',
  3: 'xl',
  4: 'lg',
  5: 'base',
  6: 'sm',
};

/**
 * A section heading on the type scale. Goes on a native `h1`–`h6`, so the document outline and
 * the heading role come from the element; the level picks a default size (h1 3xl, h2 2xl, h3 xl,
 * h4 lg, h5 base, h6 sm) that `size` can override when the visual and the outline differ.
 *
 * ```html
 * <h1 dsHeading>Billing</h1>
 * <h3 dsHeading size="lg">Payment method</h3>
 * ```
 *
 * Sizes, weights, line height and letter spacing come from tokens (`--pada-heading-*`), never
 * inline styles. React has no Heading yet: it is designed from the roadmap entry ("Text
 * becomes Text + Heading with token-based sizes").
 */
@Component({
  selector: 'h1[dsHeading], h2[dsHeading], h3[dsHeading], h4[dsHeading], h5[dsHeading], h6[dsHeading]',
  template: '<ng-content />',
  styleUrl: './heading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-level]': 'level',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-weight]': 'weight()',
  },
})
export class HeadingComponent {
  /** Font size on the type scale. Defaults by level (h1 `3xl` … h6 `sm`). */
  readonly size = input<TextSize>();
  /** Font weight, 100–900. @default '600' */
  readonly weight = input<TextWeight>('600');

  protected readonly level = Number(
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName.slice(1),
  ) as HeadingLevel;
  protected readonly resolvedSize = computed(() => this.size() ?? LEVEL_SIZES[this.level]);
}
