import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  PendingTasks,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  isBuiltInIcon,
  isSvgMarkup,
  loadedIcons,
  loadIcons,
  loadSvg,
  materialSymbolUrl,
  recolorSvg,
} from './icon-markup';

export type IconVariant = 'stroke' | 'fill';

/**
 * An SVG icon that takes the surrounding text colour. Built-in names (see `loadIconNames()`,
 * e.g. `tick_1`, `chevron_down`, `cross_1`, `search`) ship with the library in a chunk that loads
 * on first use (server rendering waits for it). Any other name falls back to Material Symbols,
 * fetched from a CDN. If the name resolves in neither place, nothing renders.
 *
 * Decorative by default (`aria-hidden`); pass `label` when the icon carries meaning on its own.
 */
@Component({
  selector: 'ds-icon',
  template: `@if (markup(); as svg) {
    <span class="icon-svg" [innerHTML]="svg"></span>
  }`,
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--pada-icon-box]': 'box()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[attr.data-variant]': 'variant()',
  },
})
export class IconComponent {
  /** Icon name (snake_case): a built-in icon, or a Material Symbols name. */
  readonly name = input<string>();
  /**
   * Custom SVG: a URL or raw `<svg>` markup. Takes precedence over `name`. It is rendered as is,
   * so only pass markup and URLs you trust.
   */
  readonly src = input<string>();
  /** Size in px (a number) or any CSS length. @default 20 */
  readonly size = input<number | string>(20);
  /** Material Symbols style: outlined (`stroke`) or filled (`fill`). Built-in icons have one style. */
  readonly variant = input<IconVariant>('stroke');
  /** Accessible name. Without it the icon is hidden from assistive technology. */
  readonly label = input<string>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly remote = signal<string | null>(null);
  private readonly icons = signal(loadedIcons());

  protected readonly box = computed(() => {
    const size = this.size();
    return typeof size === 'number' ? `${size}px` : size;
  });

  /** Markup available without a request: inline `src` markup, or a built-in icon. */
  private readonly inline = computed(() => {
    const src = this.src();
    if (src !== undefined) return isSvgMarkup(src) ? src : undefined;
    const name = this.name();
    const icons = this.icons();
    return name && icons && isBuiltInIcon(icons, name) ? icons[name] : undefined;
  });

  /** What has to be fetched: a custom URL, or the Material Symbols fallback. */
  private readonly remoteUrl = computed(() => {
    if (this.inline() !== undefined) return '';
    const src = this.src();
    if (src !== undefined) return src;
    const name = this.name();
    // Wait for the built-in set before falling back, or every icon would hit the CDN first.
    return name && this.icons() ? materialSymbolUrl(name, this.variant()) : '';
  });

  protected readonly markup = computed<SafeHtml | null>(() => {
    const markup = this.inline() ?? (this.remoteUrl() ? this.remote() : null);
    // Built-in SVGs ship with the library; custom ones come from the app (see `src`).
    return markup ? this.sanitizer.bypassSecurityTrustHtml(recolorSvg(markup)) : null;
  });

  constructor() {
    if (!this.icons()) {
      const done = inject(PendingTasks).add();
      void loadIcons()
        .then((icons) => this.icons.set(icons))
        .finally(done);
    }
    effect((onCleanup) => {
      const url = this.remoteUrl();
      this.remote.set(null);
      if (!url || typeof fetch !== 'function') return;
      let cancelled = false;
      onCleanup(() => (cancelled = true));
      void loadSvg(url).then((markup) => {
        if (!cancelled) this.remote.set(markup);
      });
    });
  }
}
