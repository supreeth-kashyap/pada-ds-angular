import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  untracked,
} from '@angular/core';

/** One entry: the id of the section it scrolls to, and its label. */
export interface IndexerItem {
  id: string;
  label: string;
}

/**
 * An "on this page" index that follows the reader: the entry of the section nearest the top
 * of the viewport is active (`aria-current="true"`), and clicking an entry scrolls its section
 * into view (smoothly, unless the user prefers reduced motion).
 *
 * ```html
 * <ds-indexer [items]="[{ id: 'install', label: 'Install' }, { id: 'usage', label: 'Usage' }]" />
 * ```
 *
 * Sections are found with `document.getElementById(item.id)`; a section is active once its top
 * passes `offset` px from the top of the viewport (35% of the viewport height by default).
 * Differences from React: `activeIndex` is a two-way `model` (React's `activeIndex` +
 * `onActiveChange`), the landmark is named through `label`, and the component tokens are
 * `--pada-indexer-*` on the accent colour instead of indigo.
 */
@Component({
  selector: 'ds-indexer',
  templateUrl: './indexer.html',
  styleUrl: './indexer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndexerComponent {
  /** The entries, in page order. */
  readonly items = input.required<IndexerItem[]>();
  /** Index of the active entry. Two-way bindable: `[(activeIndex)]`. @default 0 */
  readonly activeIndex = model(0);
  /** Distance from the top of the viewport, in px, at which a section becomes active. */
  readonly offset = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null || value === '' ? undefined : numberAttribute(value),
  });
  /** Accessible name of the navigation landmark. @default 'On this page' */
  readonly label = input('On this page');

  private readonly doc = inject(DOCUMENT);
  // After a click, scroll updates are ignored until the clicked section arrives (or a timeout).
  private scrollLockIndex: number | null = null;
  private scrollLockTimer: ReturnType<typeof setTimeout> | null = null;
  private frame: number | null = null;
  private ready = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const win = this.doc.defaultView;
      if (!win) return;
      const onScroll = () => this.scheduleUpdate();
      win.addEventListener('scroll', onScroll, { passive: true });
      win.addEventListener('resize', onScroll);
      this.ready = true;
      this.update();
      destroyRef.onDestroy(() => {
        win.removeEventListener('scroll', onScroll);
        win.removeEventListener('resize', onScroll);
        if (this.frame !== null) win.cancelAnimationFrame?.(this.frame);
        if (this.scrollLockTimer !== null) clearTimeout(this.scrollLockTimer);
      });
    });
    // New items or a new offset: re-read the positions.
    effect(() => {
      this.items();
      this.offset();
      untracked(() => {
        if (this.ready) this.update();
      });
    });
  }

  private scheduleUpdate() {
    const win = this.doc.defaultView;
    if (!win || this.frame !== null) return;
    const request =
      win.requestAnimationFrame?.bind(win) ?? ((callback: () => void) => setTimeout(callback, 16));
    this.frame = request(() => {
      this.frame = null;
      this.update();
    }) as number;
  }

  /** Activates the entry of the section nearest the top. Runs on scroll and resize. */
  update() {
    const win = this.doc.defaultView;
    const items = this.items();
    if (!win || items.length === 0) return;
    const offset = this.offset();
    const threshold = typeof offset === 'number' ? offset : win.innerHeight * 0.35;
    const scrollPosition = win.scrollY + threshold;
    let next = 0;
    let hasTargets = false;
    items.forEach((item, index) => {
      const element = this.doc.getElementById(item.id);
      if (!element) return;
      hasTargets = true;
      if (element.getBoundingClientRect().top + win.scrollY <= scrollPosition) next = index;
    });
    if (!hasTargets) return;
    if (this.scrollLockIndex !== null) {
      if (next !== this.scrollLockIndex) return;
      this.releaseScrollLock();
    }
    if (next !== this.activeIndex()) this.activeIndex.set(next);
  }

  protected select(item: IndexerItem, index: number) {
    const element = this.doc.getElementById(item.id);
    if (element) {
      this.releaseScrollLock();
      this.scrollLockIndex = index;
      this.scrollLockTimer = setTimeout(() => this.releaseScrollLock(), 1200);
      const reduced = !!this.doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')
        .matches;
      element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
    this.activeIndex.set(index);
  }

  private releaseScrollLock() {
    this.scrollLockIndex = null;
    if (this.scrollLockTimer !== null) clearTimeout(this.scrollLockTimer);
    this.scrollLockTimer = null;
  }
}
