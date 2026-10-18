import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A keyboard key or shortcut, as in "Press ⌘ K". Goes on a native `<kbd>`.
 *
 * ```html
 * <kbd dsKbd>Esc</kbd>
 * <kbd dsKbd [keys]="['⌘', 'K']"></kbd>
 * ```
 *
 * With `keys`, the host becomes a group of nested `<kbd>` keys (the HTML way to mark up a key
 * combination) and projected content is ignored.
 */
@Component({
  selector: 'kbd[dsKbd]',
  template: `
    @if (keys(); as keys) {
      @for (key of keys; track $index) {
        <kbd class="kbd">{{ key }}</kbd>
      }
    } @else {
      <ng-content />
    }
  `,
  styleUrl: './kbd.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-group]': 'keys() ? "" : null' },
})
export class KbdComponent {
  /** Several keys pressed together, e.g. `['⌘', 'K']`. Rendered as separate keys. */
  readonly keys = input<string[]>();
}
