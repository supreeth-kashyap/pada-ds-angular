import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';

/**
 * Keeps its content at a fixed shape; images, videos, iframes, canvases and SVGs inside fill it
 * (cropped to fit).
 *
 * ```html
 * <ds-aspect-ratio [ratio]="16 / 9">
 *   <img src="/cover.jpg" alt="Team offsite" />
 * </ds-aspect-ratio>
 * ```
 */
@Component({
  selector: 'ds-aspect-ratio',
  template: '<ng-content />',
  styleUrl: './aspect-ratio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.--pada-aspect-ratio]': 'ratio()' },
})
export class AspectRatioComponent {
  /** Width divided by height: `16 / 9`, `1`, `4 / 3`. @default 1 */
  readonly ratio = input(1, { transform: numberAttribute });
}
