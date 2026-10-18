import {
  ApplicationRef,
  computed,
  Directive,
  DOCUMENT,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { injectButtonType } from '../utils/button';
import {
  DS_THEME_CONTEXT,
  DsThemeContext,
  injectPrefersDark,
  readStoredTheme,
  ResolvedTheme,
  storeTheme,
  ThemeContrast,
  ThemeDensity,
  themeAttributes,
  ThemeMode,
  ThemeMotion,
  ThemeNeutral,
  ThemeRadius,
  ThemeService,
} from './theme.service';

/**
 * Gives a subtree its own theme axes (`data-theme`, `data-accent`, `data-density`, …), like
 * React's `<ThemeProvider target="element">`. Theme toggles and other parts inside it act on
 * this scope rather than the page. For the whole page, use `ThemeService` / `provideTheme()`.
 *
 * ```html
 * <section dsTheme defaultTheme="dark" accent="amber" density="compact">…</section>
 * ```
 *
 * The theme is uncontrolled unless you bind `[theme]` (or `[(theme)]`). Knobs such as
 * `--pada-accent-hue` only take effect on an element that carries an axis attribute, so
 * `accentHue` is set on this element and matters only with `accent="custom"`. Overlays opened
 * inside stay in place in the DOM, so they keep the scope's theme without a portal.
 */
@Directive({
  selector: '[dsTheme]',
  exportAs: 'dsTheme',
  providers: [{ provide: DS_THEME_CONTEXT, useExisting: DsTheme }],
  host: {
    '[attr.data-theme]': 'attributes()["data-theme"]',
    '[attr.data-accent]': 'attributes()["data-accent"]',
    '[attr.data-neutral]': 'attributes()["data-neutral"]',
    '[attr.data-density]': 'attributes()["data-density"]',
    '[attr.data-radius]': 'attributes()["data-radius"]',
    '[attr.data-motion]': 'attributes()["data-motion"]',
    '[attr.data-contrast]': 'attributes()["data-contrast"]',
    '[style.--pada-accent-hue]': 'accentHue() ?? null',
  },
})
export class DsTheme implements DsThemeContext {
  /** Controlled theme. Leave unset to let the scope keep it (from storage or `defaultTheme`). */
  // Aliased: `theme` is the scope's resolved choice (DsThemeContext), `[theme]` the controlled value.
  // eslint-disable-next-line @angular-eslint/no-input-rename
  readonly themeInput = input<ThemeMode | undefined>(undefined, { alias: 'theme' });
  /** Initial theme when uncontrolled and nothing is stored. @default 'system' */
  readonly defaultTheme = input<ThemeMode>('system');
  /** Remember the chosen theme in localStorage under this key. */
  readonly storageKey = input<string>();
  /** Accent palette: any palette hue (`indigo`, `amber`, …) or `custom` (uses `accentHue`). */
  readonly accent = input<string>();
  /** Hue (0–360) of the accent when `accent="custom"`; sets `--pada-accent-hue` here. */
  readonly accentHue = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null || value === '' ? undefined : numberAttribute(value),
  });
  /** Neutral palette for surfaces, text and borders. */
  readonly neutral = input<ThemeNeutral>();
  readonly density = input<ThemeDensity>();
  readonly radius = input<ThemeRadius>();
  /** Override the OS reduced-motion setting. */
  readonly motion = input<ThemeMotion>();
  readonly contrast = input<ThemeContrast>();
  /** The theme changed through `setTheme` (a toggle inside, or your code). */
  readonly themeChange = output<ThemeMode>();

  private readonly doc = inject(DOCUMENT);
  private readonly prefersDark = injectPrefersDark();
  private readonly own = signal<ThemeMode | null>(null);
  private readonly stored = computed(() => readStoredTheme(this.doc, this.storageKey()));

  /** The chosen theme. */
  readonly theme = computed<ThemeMode>(
    () => this.themeInput() ?? this.own() ?? this.stored() ?? this.defaultTheme(),
  );
  /** The theme actually shown: `system` resolved through `prefers-color-scheme`. */
  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const theme = this.theme();
    return theme === 'system' ? (this.prefersDark() ? 'dark' : 'light') : theme;
  });
  protected readonly attributes = computed(() =>
    themeAttributes({
      theme: this.theme(),
      accent: this.accent(),
      neutral: this.neutral(),
      density: this.density(),
      radius: this.radius(),
      motion: this.motion(),
      contrast: this.contrast(),
    }),
  );

  setTheme(theme: ThemeMode) {
    if (theme === this.theme()) return;
    if (this.themeInput() === undefined) this.own.set(theme);
    storeTheme(this.doc, this.storageKey(), theme);
    this.themeChange.emit(theme);
  }
}

interface ViewTransitionDocument {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
}

/**
 * Switches the nearest theme (a `[dsTheme]` scope, else the page-wide `ThemeService`) between
 * light and dark. Gets `aria-label` ("Switch to dark theme") and `data-theme-current`. Where the
 * browser supports view transitions and motion is allowed, it sets `--pada-theme-reveal-x/y` on
 * `<html>` to its centre and switches inside a view transition, so the new theme can spread
 * from the button.
 */
@Directive({
  selector: '[dsThemeToggle]',
  exportAs: 'dsThemeToggle',
  host: {
    '[attr.aria-label]': 'label()',
    '[attr.data-theme-current]': 'context.resolvedTheme()',
    '(click)': 'toggle($event)',
  },
})
export class DsThemeToggle {
  /** The theme this toggle switches. */
  readonly context: DsThemeContext =
    inject(DS_THEME_CONTEXT, { optional: true }) ?? inject(ThemeService);
  private readonly element = injectButtonType();
  private readonly doc = inject(DOCUMENT);
  private readonly appRef = inject(ApplicationRef);

  /** The theme a click switches to. */
  readonly next = computed<ResolvedTheme>(() =>
    this.context.resolvedTheme() === 'dark' ? 'light' : 'dark',
  );
  protected readonly label = computed(() => `Switch to ${this.next()} theme`);

  protected toggle(event: Event) {
    if (event.defaultPrevented) return;
    const next = this.next();
    const doc = this.doc as Document & ViewTransitionDocument;
    const view = doc.defaultView;
    const reduced =
      !!view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      doc.documentElement.dataset['motion'] === 'reduced';
    if (typeof doc.startViewTransition !== 'function' || reduced) {
      this.context.setTheme(next);
      return;
    }
    const rect = this.element.getBoundingClientRect();
    const root = doc.documentElement;
    root.style.setProperty('--pada-theme-reveal-x', `${rect.left + rect.width / 2}px`);
    root.style.setProperty('--pada-theme-reveal-y', `${rect.top + rect.height / 2}px`);
    doc.startViewTransition(() => {
      this.context.setTheme(next);
      // Render now, so the transition captures the new theme (React's flushSync).
      this.appRef.tick();
    });
  }
}
