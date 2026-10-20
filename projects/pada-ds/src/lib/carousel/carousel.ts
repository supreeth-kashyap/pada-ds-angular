import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  signal,
} from '@angular/core';
import { ButtonComponent } from '../button/button';
import { IconComponent } from '../icon/icon';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * A rotating set of slides (WAI-ARIA APG Carousel): a `region` with
 * `aria-roledescription="carousel"`, slides as `group`s named "2 of 5", previous and next
 * buttons, a rotation button and one dot per slide (the current one has `aria-current`).
 *
 * ```html
 * <ds-carousel label="Highlights" [interval]="5000">
 *   <ds-carousel-slide><img src="a.jpg" alt="…" /></ds-carousel-slide>
 *   <ds-carousel-slide><img src="b.jpg" alt="…" /></ds-carousel-slide>
 * </ds-carousel>
 * ```
 *
 * Auto-rotation pauses while the pointer or keyboard focus is inside, can be stopped with the
 * rotation button, and never runs when the user prefers reduced motion. Slide changes are
 * announced (`aria-live="polite"`) only when they come from the user. Differences from React:
 * slides are `ds-carousel-slide` parts (React takes any children), inactive slides stay in the
 * DOM with `hidden` (so they keep their state), and the current index is a two-way `model`.
 * Restyle through `--pada-carousel-*` tokens.
 */
@Component({
  selector: 'ds-carousel',
  imports: [ButtonComponent, IconComponent],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'region',
    'aria-roledescription': 'carousel',
    '[attr.aria-label]': 'label()',
    '[attr.data-rotating]': 'rotating() ? "" : null',
    '(pointerenter)': 'hovered.set(true)',
    '(pointerleave)': 'hovered.set(false)',
    '(focusin)': 'focused.set(true)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class CarouselComponent {
  /** Advance automatically. Pauses on hover and focus, and never runs under reduced motion. @default true */
  readonly autoPlay = input(true, { transform: booleanAttribute });
  /** Time each slide shows while rotating, in ms. @default 3000 */
  readonly interval = input(3000, { transform: numberAttribute });
  /** Show one dot per slide. @default true */
  readonly showDots = input(true, { transform: booleanAttribute });
  /** Show the previous and next buttons. @default true */
  readonly showNav = input(true, { transform: booleanAttribute });
  /** Accessible name of the carousel region. @default 'Carousel' */
  readonly label = input('Carousel');
  /** Index of the current slide, from 0. Two-way bindable: `[(index)]`. */
  readonly index = model(0);

  /** The slides, in order. */
  readonly slides = contentChildren(CarouselSlideComponent);
  readonly total = computed(() => this.slides().length);

  protected readonly paused = signal(false);
  protected readonly hovered = signal(false);
  protected readonly focused = signal(false);
  private readonly reducedMotion = signal(false);
  protected readonly canRotate = computed(
    () => this.autoPlay() && this.total() > 1 && !this.reducedMotion(),
  );
  protected readonly rotating = computed(
    () => this.canRotate() && !this.paused() && !this.hovered() && !this.focused(),
  );
  protected readonly dots = computed(() => this.slides().map((_, index) => index));

  constructor() {
    const query = inject(DOCUMENT).defaultView?.matchMedia?.(REDUCED_MOTION);
    if (query) {
      this.reducedMotion.set(query.matches);
      const onChange = () => this.reducedMotion.set(query.matches);
      query.addEventListener?.('change', onChange);
      inject(DestroyRef).onDestroy(() => query.removeEventListener?.('change', onChange));
    }
    effect((onCleanup) => {
      if (!this.rotating()) return;
      const timer = setInterval(() => this.next(), this.interval());
      onCleanup(() => clearInterval(timer));
    });
  }

  /** Shows the previous slide, wrapping round. */
  previous() {
    const total = this.total();
    if (total > 1) this.index.set((this.index() - 1 + total) % total);
  }

  /** Shows the next slide, wrapping round. */
  next() {
    const total = this.total();
    if (total > 1) this.index.set((this.index() + 1) % total);
  }

  protected onFocusOut(event: FocusEvent) {
    const host = event.currentTarget as HTMLElement;
    if (!host.contains(event.relatedTarget as Node | null)) this.focused.set(false);
  }
}

/** One slide: a `group` named "n of N", shown while it is the current one. */
@Component({
  selector: 'ds-carousel-slide',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'carousel-slide',
    role: 'group',
    'aria-roledescription': 'slide',
    '[attr.aria-label]': 'name()',
    '[attr.hidden]': 'current() ? null : ""',
    '[attr.data-state]': 'current() ? "active" : "inactive"',
  },
})
export class CarouselSlideComponent {
  private readonly carousel = inject(CarouselComponent);
  /** Position among the slides, from 0. */
  readonly position = computed(() => this.carousel.slides().indexOf(this));
  /** Whether this is the slide on show. */
  readonly current = computed(() => this.position() === this.carousel.index());
  protected readonly name = computed(() => `${this.position() + 1} of ${this.carousel.total()}`);
}

/** Every Carousel part, for `imports`. */
export const CarouselParts = [CarouselComponent, CarouselSlideComponent] as const;
