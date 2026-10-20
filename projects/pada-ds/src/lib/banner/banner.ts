import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon';

/**
 * A wide promotional or informational strip: an optional visual, a title, a subtitle and an
 * action.
 *
 * ```html
 * <ds-banner title="Invite your team" subtitle="Pada is better together." visualIcon="team">
 *   <button dsButton variant="secondary" (click)="invite()">Invite</button>
 * </ds-banner>
 * ```
 *
 * Differences from React: the action is projected content (bind its own `(click)`), not a
 * `button` prop with `onButtonClick`. `title` sets the heading only: it never becomes the
 * host's native tooltip. The surface follows the theme (`--pada-color-surface`) where React
 * uses static white.
 */
@Component({
  selector: 'ds-banner',
  imports: [IconComponent],
  template: `
    @if (visualImage(); as image) {
      <div class="banner-visual">
        <img class="banner-visual-image" [src]="image" [alt]="visualAlt()" width="36" height="36" />
      </div>
    } @else if (visualIcon(); as icon) {
      <div class="banner-visual">
        <ds-icon [name]="icon" [size]="36" />
      </div>
    }
    <div class="banner-body">
      <div class="banner-title">{{ title() }}</div>
      @if (subtitle()) {
        <div class="banner-subtitle">{{ subtitle() }}</div>
      }
    </div>
    <div class="banner-action"><ng-content /></div>
  `,
  styleUrl: './banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.title]': 'null' },
})
export class BannerComponent {
  /** The headline, on one line (truncated). */
  readonly title = input.required<string>();
  /** Supporting text, up to three lines. */
  readonly subtitle = input<string>();
  /** Built-in or Material Symbols icon name for the leading visual. */
  readonly visualIcon = input<string>();
  /** Image URL for the leading visual. Takes precedence over `visualIcon`. */
  readonly visualImage = input<string>();
  /** Alt text for `visualImage`. @default '' (decorative) */
  readonly visualAlt = input('');
}
