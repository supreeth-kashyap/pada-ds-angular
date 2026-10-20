import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MARK_LEFT, MARK_RIGHT, WORDMARK } from './pada-logo-paths';

export type PadaLogoVariant = 'lockup' | 'mark' | 'wordmark';
export type PadaLogoTone = 'color' | 'accent' | 'mono';
export type PadaLogoSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<PadaLogoSize, number> = { sm: 20, md: 32, lg: 48, xl: 64 };
const MARK = { width: 28.67, height: 32.875 };
const WORDMARK_BOX = { width: 109.484, height: 15.875 };
// The wordmark sits centred on the mark, eight units to its right.
const LOCKUP = { width: 146.2, height: 32.875, wordmarkX: 36.7, wordmarkY: 8.5 };

/**
 * The Pada logo: the geometric mark, the "Pada . design" wordmark, or both, as inline SVG.
 *
 * ```html
 * <ds-pada-logo size="lg" />
 * <ds-pada-logo variant="mark" [size]="16" decorative />
 * <ds-pada-logo variant="mark" animated="loop" />  <!-- a branded loading indicator -->
 * ```
 *
 * The `<svg>` inside is the image (or, when looping, the status); the host is a wrapper.
 * `title` sets the accessible name only: it never becomes the host's native tooltip.
 */
@Component({
  selector: 'ds-pada-logo',
  template: `
    <svg
      class="pada-logo"
      focusable="false"
      [attr.viewBox]="viewBox()"
      [attr.width]="width()"
      [attr.height]="height()"
      [attr.role]="decorative() ? null : animated() === 'loop' ? 'status' : 'img'"
      [attr.aria-label]="decorative() ? null : accessibleName()"
      [attr.aria-hidden]="decorative() ? 'true' : null"
      [attr.data-tone]="tone()"
      [attr.data-variant]="variant()"
      [attr.data-animated]="animation()"
    >
      @if (variant() !== 'wordmark') {
        <g class="pada-logo-mark">
          <path class="pada-logo-half" data-side="left" [attr.d]="markLeft" />
          <path class="pada-logo-half" data-side="right" [attr.d]="markRight" />
        </g>
      }
      @if (variant() !== 'mark') {
        <path class="pada-logo-wordmark" [attr.d]="wordmark" [attr.transform]="wordmarkTransform()" />
      }
    </svg>
  `,
  styleUrl: './pada-logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.title]': 'null' },
})
export class PadaLogoComponent {
  /** `lockup` (mark and wordmark), `mark` alone, or `wordmark` alone. @default 'lockup' */
  readonly variant = input<PadaLogoVariant>('lockup');
  /**
   * `color`: amber left half, accent right half (it follows `data-accent`), stone wordmark.
   * `accent`: both halves in the accent. `mono`: everything in `currentColor`. @default 'color'
   */
  readonly tone = input<PadaLogoTone>('color');
  /** Height in px, or a preset: sm 20, md 32, lg 48, xl 64. @default 'md' */
  readonly size = input<PadaLogoSize | number>('md');
  /**
   * `true` steps in once on mount (left half, right half, then the wordmark); `'loop'` lifts the
   * halves in turn, for a branded loading indicator. Both are still under reduced motion.
   */
  readonly animated = input<boolean | 'loop', unknown>(false, {
    transform: (value: unknown) => (value === 'loop' ? 'loop' : booleanAttribute(value)),
  });
  /** Accessible name. @default 'Pada' ('Loading' when looping) */
  readonly title = input<string>();
  /** Hides the logo from assistive technology, when a text label sits next to it. */
  readonly decorative = input(false, { transform: booleanAttribute });

  protected readonly markLeft = MARK_LEFT;
  protected readonly markRight = MARK_RIGHT;
  protected readonly wordmark = WORDMARK;

  private readonly box = computed(() => {
    const variant = this.variant();
    return variant === 'mark' ? MARK : variant === 'wordmark' ? WORDMARK_BOX : LOCKUP;
  });
  protected readonly height = computed(() => {
    const size = this.size();
    return typeof size === 'number' ? size : SIZES[size];
  });
  protected readonly width = computed(() => (this.height() * this.box().width) / this.box().height);
  protected readonly viewBox = computed(() => `0 0 ${this.box().width} ${this.box().height}`);
  protected readonly animation = computed(() => {
    const animated = this.animated();
    return animated === 'loop' ? 'loop' : animated ? 'enter' : null;
  });
  protected readonly accessibleName = computed(
    () => this.title() ?? (this.animated() === 'loop' ? 'Loading' : 'Pada'),
  );
  protected readonly wordmarkTransform = computed(() =>
    this.variant() === 'lockup' ? `translate(${LOCKUP.wordmarkX} ${LOCKUP.wordmarkY})` : null,
  );
}
