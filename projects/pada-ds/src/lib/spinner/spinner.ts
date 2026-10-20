import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DsVisuallyHidden } from 'pada-ds-angular/headless';

export type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * An indeterminate loading indicator. Rotates; under reduced motion it pulses slowly instead.
 *
 * ```html
 * <ds-spinner label="Saving" />
 * <ds-spinner size="sm" [label]="null" />  <!-- inside something already marked busy -->
 * ```
 */
@Component({
  selector: 'ds-spinner',
  imports: [DsVisuallyHidden],
  template: `
    <span class="spinner-ring" aria-hidden="true"></span>
    @if (label()) {
      <span dsVisuallyHidden>{{ label() }}</span>
    }
  `,
  styleUrl: './spinner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'label() ? "status" : null',
    '[attr.data-size]': 'size()',
  },
})
export class SpinnerComponent {
  /** sm 12px, md 16px, lg 24px. @default 'md' */
  readonly size = input<SpinnerSize>('md');
  /**
   * Text announced to screen readers (`role="status"`). Pass `null` when the spinner sits inside
   * something already marked busy, such as a loading button. @default 'Loading'
   */
  readonly label = input<string | null>('Loading');
}
