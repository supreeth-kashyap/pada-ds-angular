import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  InjectionToken,
  input,
  Provider,
} from '@angular/core';

export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Maps a brand logo name to the URL of its image. */
export type BrandLogoUrlResolver = (name: string) => string;

/**
 * Where `ds-brand-logo` finds its images. By default `assets/logos/name=<name>.svg`, the file
 * naming of Pada's logo library; set your own with `provideBrandLogoUrl`.
 */
export const BRAND_LOGO_URL = new InjectionToken<BrandLogoUrlResolver>('BRAND_LOGO_URL', {
  providedIn: 'root',
  factory: () => (name) => `assets/logos/name=${name}.svg`,
});

/**
 * Configures where brand logos load from, in `bootstrapApplication` or a component's
 * `providers`:
 *
 * ```ts
 * provideBrandLogoUrl((name) => `/static/logos/${name}.svg`)
 * ```
 */
export const provideBrandLogoUrl = (resolve: BrandLogoUrlResolver): Provider => ({
  provide: BRAND_LOGO_URL,
  useValue: resolve,
});

/**
 * A third-party brand logo (Slack, GitHub, …) by name, from your copy of Pada's logo library.
 *
 * ```html
 * <ds-brand-logo name="github" size="lg" background tooltip="Connected" />
 * ```
 *
 * Differences from React: this is React's `BrandLogo` (there is no deprecated `Logo` alias).
 * The library does not bundle the logo images: serve them from your app (by default at
 * `assets/logos/name=<name>.svg`), point `provideBrandLogoUrl` elsewhere, or pass `src`. The
 * hover `tooltip` is a CSS stand-in until the Pada tooltip lands in Angular; it is decorative.
 */
@Component({
  selector: 'ds-brand-logo',
  template: `
    <img class="brand-logo-img" [src]="url()" [alt]="name()" />
    @if (tooltip()) {
      <span class="brand-logo-tooltip" aria-hidden="true">{{ tooltip() }}</span>
    }
  `,
  styleUrl: './brand-logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'size()',
    '[attr.data-background]': 'background() ? "" : null',
  },
})
export class BrandLogoComponent {
  /** Logo name in the library, e.g. `github`, `slack`. Also the image's alt text. */
  readonly name = input.required<string>();
  /** xs 12px, sm 16px, md 20px, lg 24px, xl 28px, 2xl 32px. @default 'md' */
  readonly size = input<BrandLogoSize>('md');
  /** Puts the logo on a padded, rounded neutral tile. */
  readonly background = input(false, { transform: booleanAttribute });
  /** Text shown above the logo on hover. */
  readonly tooltip = input<string>();
  /** Image URL to use instead of resolving `name`. */
  readonly src = input<string>();

  private readonly resolve = inject(BRAND_LOGO_URL);
  protected readonly url = computed(() => this.src() ?? this.resolve(this.name()));
}
