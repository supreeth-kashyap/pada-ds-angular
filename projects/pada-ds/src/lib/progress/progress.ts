import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { uniqueId } from 'pada-ds-angular/headless';

/**
 * A determinate progress bar.
 *
 * ```html
 * <ds-progress label="Uploading" [value]="42" />
 * ```
 *
 * Differences from React: `role="progressbar"` sits on the track and is named by `label`
 * (React puts it on the fill and leaves it unnamed), and the fill is clamped to 0–100%.
 */
@Component({
  selector: 'ds-progress',
  template: `
    @if (label()) {
      <span class="progress-label" [id]="labelId">{{ label() }}</span>
    }
    <div
      class="progress-bar"
      role="progressbar"
      aria-valuemin="0"
      [attr.aria-valuemax]="max()"
      [attr.aria-valuenow]="value()"
      [attr.aria-labelledby]="label() ? labelId : null"
      [attr.aria-label]="label() ? null : ariaLabel()"
    >
      <div class="progress-indicator" [style.width.%]="percentage()"></div>
    </div>
  `,
  styleUrl: './progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressComponent {
  /** Current value, from 0 to `max`. */
  readonly value = input.required<number>();
  /** The value that means done. @default 100 */
  readonly max = input(100);
  /** Visible label above the bar; also its accessible name. */
  readonly label = input<string>();
  /** Accessible name when there is no visible `label`. @default 'Progress' */
  readonly ariaLabel = input('Progress');

  protected readonly labelId = uniqueId('ds-progress-label-');
  protected readonly percentage = computed(() => {
    const max = this.max();
    const percentage = max > 0 ? (this.value() / max) * 100 : 0;
    return Math.min(100, Math.max(0, percentage));
  });
}
