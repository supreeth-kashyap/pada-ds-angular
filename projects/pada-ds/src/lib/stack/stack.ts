import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/** A spacing step: `n × 0.25rem × density` (`3` is 12px at default density). */
export type LayoutSpace = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

/** Accepts a step as a number or as a static attribute string (`gap="3"`). */
export const toLayoutSpace = (value: LayoutSpace | `${LayoutSpace}`): LayoutSpace =>
  Number(value) as LayoutSpace;

/** The `--pada-space-*` token for a spacing step. */
export const layoutSpaceToken = (gap: LayoutSpace): string =>
  gap === 0 ? '0px' : `var(--pada-space-${String(gap).replace('.', '-')})`;

export type StackDirection = 'row' | 'column';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around';

/**
 * Flex layout with token-based gaps, so spacing follows density. Use the element, or put
 * `dsStack` on the element you need (React's `as` prop):
 *
 * ```html
 * <ds-stack direction="row" gap="3" align="center">
 *   <button dsButton>Save</button>
 *   <button dsButton variant="ghost">Cancel</button>
 * </ds-stack>
 *
 * <ul dsStack gap="1">…</ul>
 * ```
 */
@Component({
  selector: 'ds-stack, [dsStack]',
  template: '<ng-content />',
  styleUrl: './stack.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-direction]': 'direction()',
    '[attr.data-align]': 'align() ?? null',
    '[attr.data-justify]': 'justify() ?? null',
    '[attr.data-wrap]': 'wrap() ? "" : null',
    '[style.--pada-stack-gap]': 'gapToken()',
  },
})
export class StackComponent {
  /** Main axis. @default 'column' */
  readonly direction = input<StackDirection>('column');
  /** Gap in spacing steps (n × 0.25rem × density): `gap="3"` is 12px at default density. @default 2 */
  readonly gap = input<LayoutSpace, LayoutSpace | `${LayoutSpace}`>(2, {
    transform: toLayoutSpace,
  });
  /** Cross-axis alignment. Stretches when unset. */
  readonly align = input<StackAlign>();
  /** Main-axis distribution. Packs at the start when unset. */
  readonly justify = input<StackJustify>();
  /** Wrap onto new lines when out of room. */
  readonly wrap = input(false, { transform: booleanAttribute });

  protected readonly gapToken = computed(() => layoutSpaceToken(this.gap()));
}
