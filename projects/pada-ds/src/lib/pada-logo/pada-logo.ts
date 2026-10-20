import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type PadaLogoVariant = 'lockup' | 'mark' | 'wordmark';
export type PadaLogoTone = 'color' | 'accent' | 'mono';
export type PadaLogoSize = 'sm' | 'md' | 'lg' | 'xl';

// "Twin Soles": two soles standing on a shared baseline (pāda, Sanskrit for foot: the part
// that carries the weight). The left sole is drawn once and mirrored for the right.
const SOLE =
  'M10.6 3.6C13.4 3.6 15 5.9 15 9.2C15 12.3 14 14.5 13.3 16.7C12.8 18.4 13 20.4 13.4 22.3C13.9 24.8 12.3 26.7 10.1 26.7C7.8 26.7 6.3 25 6.3 22.6C6.3 19.6 4.9 17.3 4.5 14.2C3.9 9 6.6 3.6 10.6 3.6Z';
const MIRROR = 'matrix(-1 0 0 1 32 0)';

const SIZES: Record<PadaLogoSize, number> = { sm: 20, md: 32, lg: 48, xl: 64 };
const MARK = { width: 32, height: 32 };
const WORDMARK = { width: 67, height: 27 };
// The wordmark's baseline (y = 22) sits on the mark's ground line in the lockup.
const LOCKUP = { width: 110, height: 32, wordmarkX: 42, wordmarkY: 6.4 };

/**
 * The Pada logo: the "Twin Soles" mark, the wordmark, or both, as inline SVG.
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
          <g class="pada-logo-sole" data-side="left">
            <path [attr.d]="sole" />
            @if (showToes()) {
              <circle cx="13" cy="1.6" r="1.5" />
            }
          </g>
          <g class="pada-logo-sole" data-side="right">
            <path [attr.d]="sole" [attr.transform]="mirror" />
            @if (showToes()) {
              <circle cx="19" cy="1.6" r="1.5" />
            }
          </g>
          <rect class="pada-logo-ground" x="3" y="28.4" width="26" height="2.4" rx="1.2" />
        </g>
      }
      @if (variant() !== 'mark') {
        <!-- Geometric, single-storey letters drawn as strokes: no font needed. -->
        <g class="pada-logo-wordmark" [attr.transform]="wordmarkTransform()">
          <path d="M3 10V25.4" />
          <circle cx="9" cy="16" r="6" />
          <circle cx="25.5" cy="16" r="6" />
          <path d="M31.5 10V22" />
          <circle cx="42" cy="16" r="6" />
          <path d="M48 2.5V22" />
          <circle cx="58.5" cy="16" r="6" />
          <path d="M64.5 10V22" />
        </g>
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
   * `color`: amber left sole, accent right sole (it follows `data-accent`). `accent`: both soles
   * in the accent. `mono`: everything in `currentColor`. @default 'color'
   */
  readonly tone = input<PadaLogoTone>('color');
  /** Height in px, or a preset: sm 20, md 32, lg 48, xl 64. @default 'md' */
  readonly size = input<PadaLogoSize | number>('md');
  /** Draws a toe above each sole. Defaults to on from 48px up, where it stays legible. */
  readonly toes = input<boolean | undefined, unknown>(undefined, {
    transform: (value: unknown) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /**
   * `true` steps in once on mount (left sole, right sole, then the ground); `'loop'` walks, for
   * a branded loading indicator. Both are still under reduced motion.
   */
  readonly animated = input<boolean | 'loop', unknown>(false, {
    transform: (value: unknown) => (value === 'loop' ? 'loop' : booleanAttribute(value)),
  });
  /** Accessible name. @default 'Pada' ('Loading' when looping) */
  readonly title = input<string>();
  /** Hides the logo from assistive technology, when a text label sits next to it. */
  readonly decorative = input(false, { transform: booleanAttribute });

  protected readonly sole = SOLE;
  protected readonly mirror = MIRROR;

  private readonly box = computed(() => {
    const variant = this.variant();
    return variant === 'mark' ? MARK : variant === 'wordmark' ? WORDMARK : LOCKUP;
  });
  protected readonly height = computed(() => {
    const size = this.size();
    return typeof size === 'number' ? size : SIZES[size];
  });
  protected readonly width = computed(() => (this.height() * this.box().width) / this.box().height);
  protected readonly viewBox = computed(() => `0 0 ${this.box().width} ${this.box().height}`);
  protected readonly showToes = computed(() => this.toes() ?? this.height() >= 48);
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
