import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  signal,
} from '@angular/core';

export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

interface Edges {
  overflowing: boolean;
  start: boolean;
  end: boolean;
}

/** A number (or a numeric attribute, `maxHeight="320"`) is px; anything else is a CSS length. */
const toLength = (value: number | string | undefined) =>
  value === undefined || value === ''
    ? null
    : typeof value === 'number' || /^\d+(\.\d+)?$/.test(value)
      ? `${value}px`
      : value;

/**
 * A scrolling region with slim, themed scrollbars and faded edges. Scrolling stays native
 * (touch, wheel, keyboard, scroll snapping, find-in-page). When content overflows, the region
 * becomes focusable so keyboard users can scroll it; give it an `aria-label` then, and it
 * becomes a named `region`.
 *
 * ```html
 * <ds-scroll-area maxHeight="320" aria-label="Activity">
 *   @for (event of events; track event.id) { <p>{{ event.text }}</p> }
 * </ds-scroll-area>
 * ```
 *
 * `data-overflowing`, `data-at-start` and `data-at-end` follow the scroll position. A
 * `tabindex` or `role` you set yourself is kept.
 */
@Component({
  selector: 'ds-scroll-area',
  template: '<ng-content />',
  styleUrl: './scroll-area.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.tabindex]': 'tabIndex()',
    '[attr.role]': 'role()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-scrollbar]': 'scrollbar()',
    '[attr.data-fade]': 'fade() ? "" : null',
    '[attr.data-overflowing]': 'edges().overflowing ? "" : null',
    '[attr.data-at-start]': 'edges().start ? "" : null',
    '[attr.data-at-end]': 'edges().end ? "" : null',
    '[style.--pada-scroll-area-max-height]': 'maxHeightValue()',
    '[style.--pada-scroll-area-max-width]': 'maxWidthValue()',
    '(scroll)': 'measure()',
  },
})
export class ScrollAreaComponent {
  /** Which way it scrolls. @default 'vertical' */
  readonly orientation = input<ScrollAreaOrientation>('vertical');
  /** Maximum height before it scrolls: a number of px (`320`) or any CSS length (`50vh`). */
  readonly maxHeight = input<number | string>();
  /** Maximum width before it scrolls (horizontal). */
  readonly maxWidth = input<number | string>();
  /** Fade the edges where more content is hidden. @default true */
  readonly fade = input(true, { transform: booleanAttribute });
  /** `auto` shows the thin scrollbar while hovering or scrolling; `always` keeps it. @default 'auto' */
  readonly scrollbar = input<'auto' | 'always'>('auto');

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly ownTabIndex = inject(new HostAttributeToken('tabindex'), { optional: true });
  private readonly ownRole = inject(new HostAttributeToken('role'), { optional: true });

  protected readonly edges = signal<Edges>({ overflowing: false, start: true, end: true });

  protected readonly maxHeightValue = computed(() => toLength(this.maxHeight()));
  protected readonly maxWidthValue = computed(() => toLength(this.maxWidth()));
  // Focusable only when there is something to scroll (axe: scrollable-region-focusable).
  protected readonly tabIndex = computed(
    () => this.ownTabIndex ?? (this.edges().overflowing ? '0' : null),
  );
  protected readonly role = computed(() => {
    if (this.ownRole) return this.ownRole;
    const labelled =
      this.element.hasAttribute('aria-label') || this.element.hasAttribute('aria-labelledby');
    return this.edges().overflowing && labelled ? 'region' : null;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.measure();
      if (typeof ResizeObserver === 'undefined') return;
      const resize = new ResizeObserver(() => this.measure());
      const observeChildren = () => {
        resize.disconnect();
        resize.observe(this.element);
        Array.from(this.element.children).forEach((child) => resize.observe(child));
      };
      observeChildren();
      // Content added or removed later changes the overflow too.
      const mutations = new MutationObserver(() => {
        observeChildren();
        this.measure();
      });
      mutations.observe(this.element, { childList: true });
      destroyRef.onDestroy(() => {
        resize.disconnect();
        mutations.disconnect();
      });
    });
  }

  /** Re-reads the overflow and scroll position. Runs on scroll and resize by itself. */
  measure() {
    const element = this.element;
    const vertical = this.orientation() !== 'horizontal';
    const size = vertical ? element.clientHeight : element.clientWidth;
    const scrollSize = vertical ? element.scrollHeight : element.scrollWidth;
    const position = Math.abs(vertical ? element.scrollTop : element.scrollLeft);
    const next = {
      overflowing: scrollSize > size + 1,
      start: position <= 1,
      end: position + size >= scrollSize - 1,
    };
    const previous = this.edges();
    if (
      previous.overflowing !== next.overflowing ||
      previous.start !== next.start ||
      previous.end !== next.end
    ) {
      this.edges.set(next);
    }
  }
}
