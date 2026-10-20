import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { DsTheme, DsThemeToggle, uniqueId } from 'pada-ds-angular/headless';

/**
 * Gives a subtree its own theme: light or dark, accent, neutral, density, radius, motion and
 * contrast. A `display: contents` wrapper, so it adds no box. For the whole page use
 * `provideTheme()` and `ThemeService` from `pada-ds-angular/headless` instead (React's
 * `target="root"`).
 *
 * ```html
 * <ds-theme-provider defaultTheme="dark" accent="custom" [accentHue]="140" storageKey="panel-theme">
 *   <button dsThemeToggle></button>
 *   …
 * </ds-theme-provider>
 * ```
 *
 * Differences from React: there is no portal container, because Angular overlays stay in place
 * in the DOM and inherit the scope's attributes; `useTheme()` is `inject(DS_THEME_CONTEXT)` (a
 * scope) or `inject(ThemeService)` (the page). Knobs only apply on an element with an axis
 * attribute, so `accentHue` needs `accent="custom"`.
 */
@Component({
  selector: 'ds-theme-provider',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: DsTheme,
      inputs: [
        'theme',
        'defaultTheme',
        'storageKey',
        'accent',
        'accentHue',
        'neutral',
        'density',
        'radius',
        'motion',
        'contrast',
      ],
      outputs: ['themeChange'],
    },
  ],
  styles: ':host { display: contents; }',
})
export class ThemeProviderComponent {}

export type ThemeToggleSize = 'sm' | 'md' | 'lg';

/**
 * Switches between light and dark: a sun whose rays shrink away while a bite turns it into a
 * moon. Where the browser supports view transitions (and motion is allowed), the new theme
 * spreads from the button in a circle. Acts on the nearest `ds-theme-provider` / `[dsTheme]`,
 * else on the page-wide `ThemeService`.
 *
 * ```html
 * <button dsThemeToggle size="sm"></button>
 * ```
 *
 * It includes the headless `DsThemeToggle`; import one or the other, not both. Its styles are
 * global (the page-wide view transition cannot be scoped), and every class is prefixed
 * `theme-toggle`.
 */
@Component({
  selector: 'button[dsThemeToggle]',
  template: `
    <svg class="theme-toggle-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <!-- Sun: a disc and rays. In dark mode the rays shrink away and a bite turns the disc into a moon. -->
      <mask [attr.id]="maskId">
        <rect width="24" height="24" fill="white" />
        <circle class="theme-toggle-bite" cx="18" cy="6" r="6" fill="black" />
      </mask>
      <circle
        class="theme-toggle-disc"
        cx="12"
        cy="12"
        r="5"
        fill="currentColor"
        [attr.mask]="'url(#' + maskId + ')'"
      />
      <g class="theme-toggle-rays" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path
          d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M4.6 19.4 6 18M18 6l1.4-1.4"
        />
      </g>
    </svg>
  `,
  styleUrl: './theme-toggle.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsThemeToggle }],
  host: { class: 'theme-toggle', '[attr.data-size]': 'size()' },
})
export class ThemeToggleComponent {
  /** sm 28px, md 32px, lg 40px (scaled by density). @default 'md' */
  readonly size = input<ThemeToggleSize>('md');
  /** Unique per toggle: a shared id would make every toggle use the first one's mask. */
  protected readonly maskId = uniqueId('pada-theme-toggle-mask-');
  /** The theme state this toggle reads and switches. */
  readonly toggle = inject(DsThemeToggle);
}

/** Every Theme part, for `imports`. */
export const ThemeParts = [ThemeProviderComponent, ThemeToggleComponent] as const;
