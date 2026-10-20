import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SeparatorOrientation = 'horizontal' | 'vertical';

/**
 * A thin line between content, horizontal or vertical.
 *
 * ```html
 * <ds-separator />
 * <ds-separator orientation="vertical" [decorative]="false" />
 * ```
 */
@Component({
  selector: 'ds-separator',
  template: '',
  styleUrl: './separator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'decorative() ? "none" : "separator"',
    '[attr.aria-orientation]': 'decorative() ? null : orientation()',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class SeparatorComponent {
  /** @default 'horizontal' */
  readonly orientation = input<SeparatorOrientation>('horizontal');
  /**
   * Purely visual (the default): hidden from assistive technology. Set `false` when the line
   * separates sections that a screen reader user should know are distinct.
   */
  readonly decorative = input(true, { transform: booleanAttribute });
}
