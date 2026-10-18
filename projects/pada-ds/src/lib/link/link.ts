import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DsVisuallyHidden } from 'pada-ds-angular/headless';

export type LinkTone = 'accent' | 'neutral';
export type LinkUnderline = 'hover' | 'always';

/**
 * A text link, on a native `<a>`. Works with the router's `routerLink` too.
 *
 * ```html
 * <a dsLink href="/docs">Read the docs</a>
 * <a dsLink routerLink="/settings" tone="neutral">Settings</a>
 * <a dsLink href="https://example.com" external>Example</a>
 * ```
 *
 * Differences from React: there is no `asChild`; put `dsLink` on the router link itself.
 */
@Component({
  selector: 'a[dsLink]',
  imports: [DsVisuallyHidden],
  template: `
    <ng-content />
    @if (external()) {
      <!-- Inline SVG (not ds-icon) so links stay valid inside paragraphs. -->
      <svg
        class="link-external-icon"
        viewBox="0 0 16 16"
        width="12"
        height="12"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M6 3H3v10h10v-3M9 3h4v4M13 3 7 9"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      {{ ' ' }}<span dsVisuallyHidden>(opens in a new tab)</span>
    }
  `,
  styleUrl: './link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'link',
    '[attr.data-tone]': 'tone()',
    '[attr.data-underline]': 'underline()',
    '[attr.target]': 'external() ? "_blank" : null',
    '[attr.rel]': 'external() ? "noopener noreferrer" : null',
  },
})
export class LinkComponent {
  /** `accent`, or `neutral` (inherits the surrounding text colour). @default 'accent' */
  readonly tone = input<LinkTone>('accent');
  /** `hover` underlines on hover only; `always` keeps the underline. @default 'hover' */
  readonly underline = input<LinkUnderline>('hover');
  /** Opens in a new tab with `rel="noopener noreferrer"`, an icon and a screen-reader hint. */
  readonly external = input(false, { transform: booleanAttribute });
}
