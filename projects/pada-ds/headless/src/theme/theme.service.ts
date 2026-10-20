import {
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  EnvironmentProviders,
  inject,
  Injectable,
  InjectionToken,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  signal,
  Signal,
} from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type ThemeNeutral = 'stone' | 'slate' | 'gray' | 'zinc' | 'neutral';
export type ThemeDensity = 'compact' | 'comfortable' | 'spacious';
export type ThemeRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type ThemeMotion = 'reduced' | 'full';
export type ThemeContrast = 'standard' | 'more';

/** Pada's theme axes. Unset axes follow the parent (or the defaults on `:root`). */
export interface ThemeSettings {
  /** Light, dark, or follow the operating system. */
  theme?: ThemeMode;
  /** Accent palette: any palette hue (`indigo`, `amber`, `emerald`, …) or `custom` (uses `accentHue`). */
  accent?: string;
  /** Hue (0–360) of the accent when `accent` is `custom`; sets the `--pada-accent-hue` knob. */
  accentHue?: number;
  /** Neutral palette for surfaces, text and borders. */
  neutral?: ThemeNeutral;
  density?: ThemeDensity;
  radius?: ThemeRadius;
  /** Override the OS reduced-motion setting. */
  motion?: ThemeMotion;
  contrast?: ThemeContrast;
}

/** Settings for the page-wide theme (`provideTheme`). */
export interface ThemeOptions extends Omit<ThemeSettings, 'theme'> {
  /** Initial theme when nothing is stored. @default 'system' */
  defaultTheme?: ThemeMode;
  /** Remember the chosen theme in localStorage under this key. */
  storageKey?: string;
}

/**
 * What a theme toggle (or your own code) reads and changes: the nearest `[dsTheme]` scope, or
 * the page-wide `ThemeService`.
 */
export interface DsThemeContext {
  /** The chosen theme. */
  readonly theme: Signal<ThemeMode>;
  /** The theme actually shown: `system` resolved through `prefers-color-scheme`. */
  readonly resolvedTheme: Signal<ResolvedTheme>;
  setTheme(theme: ThemeMode): void;
}

/** Provided by `[dsTheme]` scopes, so parts inside one act on it rather than on the page. */
export const DS_THEME_CONTEXT = new InjectionToken<DsThemeContext>('DS_THEME_CONTEXT');

/** Options for `ThemeService`; set them with `provideTheme()`. */
export const DS_THEME_OPTIONS = new InjectionToken<ThemeOptions>('DS_THEME_OPTIONS');

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Whether the OS prefers dark, kept up to date. Call it in an injection context. */
export function injectPrefersDark(): Signal<boolean> {
  const query = inject(DOCUMENT).defaultView?.matchMedia?.(DARK_QUERY);
  const prefersDark = signal(!!query?.matches);
  if (query) {
    const onChange = () => prefersDark.set(query.matches);
    query.addEventListener?.('change', onChange);
    inject(DestroyRef).onDestroy(() => query.removeEventListener?.('change', onChange));
  }
  return prefersDark.asReadonly();
}

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'light' || value === 'dark' || value === 'system';

/** The theme stored under `key`, if any. */
export function readStoredTheme(doc: Document, key: string | undefined): ThemeMode | undefined {
  if (!key) return undefined;
  try {
    const value = doc.defaultView?.localStorage.getItem(key);
    return isThemeMode(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Stores the theme under `key`. Storage can be unavailable (private mode); that is fine. */
export function storeTheme(doc: Document, key: string | undefined, theme: ThemeMode) {
  if (!key) return;
  try {
    doc.defaultView?.localStorage.setItem(key, theme);
  } catch {
    // The theme still applies for this session.
  }
}

/** The `data-*` attributes for a set of theme axes (`null` removes one). */
export function themeAttributes(
  settings: ThemeSettings,
): Record<
  | 'data-theme'
  | 'data-accent'
  | 'data-neutral'
  | 'data-density'
  | 'data-radius'
  | 'data-motion'
  | 'data-contrast',
  string | null
> {
  return {
    'data-theme': !settings.theme || settings.theme === 'system' ? null : settings.theme,
    'data-accent': settings.accent ?? null,
    'data-neutral': settings.neutral ?? null,
    'data-density': settings.density ?? null,
    'data-radius': settings.radius ?? null,
    'data-motion': settings.motion ?? null,
    'data-contrast': settings.contrast ?? null,
  };
}

const ACCENT_HUE = '--pada-accent-hue';

/**
 * The page-wide theme. Applies the theme axes (`data-theme`, `data-accent`, `data-density`, …)
 * and the `--pada-accent-hue` knob to `<html>`, follows the OS colour scheme while the theme is
 * `system`, and remembers the choice when given a `storageKey`. Angular's counterpart of React's
 * `<ThemeProvider target="root">` and `useTheme()`.
 *
 * ```ts
 * // app.config.ts
 * providers: [provideTheme({ defaultTheme: 'system', storageKey: 'pada-theme', accent: 'indigo' })]
 *
 * // anywhere
 * readonly theme = inject(ThemeService);
 * this.theme.setTheme('dark');
 * this.theme.density.set('compact');
 * ```
 *
 * The axes are writable signals. Knobs only take effect on `<html>` or on an element with an
 * axis attribute, which is why the service sets `--pada-accent-hue` on `<html>` itself.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService implements DsThemeContext {
  private readonly doc = inject(DOCUMENT);
  private readonly options = inject(DS_THEME_OPTIONS, { optional: true }) ?? {};
  private readonly prefersDark = injectPrefersDark();
  private readonly chosen = signal<ThemeMode>(
    readStoredTheme(this.doc, this.options.storageKey) ?? this.options.defaultTheme ?? 'system',
  );

  /** The chosen theme. Change it with `setTheme`. */
  readonly theme = this.chosen.asReadonly();
  /** The theme actually shown: `system` resolved through `prefers-color-scheme`. */
  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const theme = this.chosen();
    return theme === 'system' ? (this.prefersDark() ? 'dark' : 'light') : theme;
  });
  /** Accent palette, or `custom` to use `accentHue`. */
  readonly accent = signal(this.options.accent);
  /** Hue (0–360) of the `custom` accent. */
  readonly accentHue = signal(this.options.accentHue);
  /** Neutral palette for surfaces, text and borders. */
  readonly neutral = signal(this.options.neutral);
  readonly density = signal(this.options.density);
  readonly radius = signal(this.options.radius);
  /** Overrides the OS reduced-motion setting. */
  readonly motion = signal(this.options.motion);
  readonly contrast = signal(this.options.contrast);

  private readonly attributes = computed(() =>
    themeAttributes({
      theme: this.chosen(),
      accent: this.accent(),
      neutral: this.neutral(),
      density: this.density(),
      radius: this.radius(),
      motion: this.motion(),
      contrast: this.contrast(),
    }),
  );

  constructor() {
    const root = this.doc.documentElement;
    const previous = Object.keys(this.attributes()).map(
      (name) => [name, root.getAttribute(name)] as const,
    );
    const previousHue = root.style.getPropertyValue(ACCENT_HUE);

    effect(() => this.apply());

    inject(DestroyRef).onDestroy(() => {
      for (const [name, value] of previous) {
        if (value === null) root.removeAttribute(name);
        else root.setAttribute(name, value);
      }
      if (previousHue) root.style.setProperty(ACCENT_HUE, previousHue);
      else root.style.removeProperty(ACCENT_HUE);
    });
  }

  /** Changes the theme, stores it under the storage key and applies it to `<html>` at once. */
  setTheme(theme: ThemeMode) {
    if (theme === this.chosen()) return;
    this.chosen.set(theme);
    storeTheme(this.doc, this.options.storageKey, theme);
    // Applied synchronously too, so a view transition captures the new theme.
    this.apply();
  }

  private apply() {
    const root = this.doc.documentElement;
    for (const [name, value] of Object.entries(this.attributes())) {
      if (value === null) root.removeAttribute(name);
      else if (root.getAttribute(name) !== value) root.setAttribute(name, value);
    }
    const hue = this.accentHue();
    if (hue === undefined) root.style.removeProperty(ACCENT_HUE);
    else root.style.setProperty(ACCENT_HUE, String(hue));
  }
}

/**
 * Configures the page-wide theme and applies it as the app starts.
 *
 * ```ts
 * bootstrapApplication(App, { providers: [provideTheme({ storageKey: 'pada-theme' })] });
 * ```
 */
export function provideTheme(options: ThemeOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: DS_THEME_OPTIONS, useValue: options },
    provideEnvironmentInitializer(() => {
      inject(ThemeService);
    }),
  ]);
}
