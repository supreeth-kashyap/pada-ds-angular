import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { dataFlag, injectButtonType } from 'pada-ds-angular/headless';
import type { ButtonSize, ButtonVariant } from '../button/button';
import { IconComponent } from '../icon/icon';

/**
 * A square button with only an icon, named by `label`. Defaults to the ghost variant. Goes on
 * a native `<button>` (or an `<a>`) and shares Button's styles and tokens.
 *
 * ```html
 * <button dsIconButton icon="edit_1" label="Rename" (click)="rename()"></button>
 * ```
 *
 * Differences from React: until the Pada tooltip lands in Angular, `tooltip` shows the label
 * as the native `title` tooltip.
 */
@Component({
  selector: 'button[dsIconButton], a[dsIconButton]',
  imports: [IconComponent],
  template: `
    <ds-icon class="icon-button-icon" [name]="icon()" [size]="iconSize()" />
    @if (loading()) {
      <span class="button-spinner" aria-hidden="true"></span>
    }
  `,
  styleUrls: ['../button/button.scss', './icon-button.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'button icon-button',
    '[attr.aria-label]': 'label()',
    '[attr.title]': 'tooltip() ? label() : null',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-loading]': 'loadingFlag()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-disabled]': 'loading() || null',
  },
})
export class IconButtonComponent {
  /** Built-in or Material Symbols icon name. */
  readonly icon = input.required<string>();
  /** Accessible name. Required: an icon alone has no text for screen readers. */
  readonly label = input.required<string>();
  /** Also shows the label as a tooltip on hover. */
  readonly tooltip = input(false, { transform: booleanAttribute });
  /** Visual emphasis. @default 'ghost' */
  readonly variant = input<ButtonVariant>('ghost');
  /** sm 28px, md 32px, lg 40px square. @default 'md' */
  readonly size = input<ButtonSize>('md');
  /** Shows a spinner in place of the icon and ignores clicks. */
  readonly loading = input(false, { transform: booleanAttribute });

  protected readonly loadingFlag = computed(() => dataFlag(this.loading()));
  protected readonly iconSize = computed(() => {
    const size = this.size();
    return size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  });

  constructor() {
    const element = injectButtonType();
    // Capture phase on the button itself runs before any (click) handler bound to it.
    element.addEventListener(
      'click',
      (event) => {
        if (!this.loading()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      { capture: true },
    );
  }
}
