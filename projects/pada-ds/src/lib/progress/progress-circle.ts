import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { progressPercentage, progressState } from './progress-value';

export type ProgressCircleSize = 'sm' | 'md' | 'lg';

/**
 * Circular progress: a ring that fills clockwise from the top, or spins while `value` is
 * `null`. For compact places (a table cell, a file row, a button); use `ds-progress` where
 * there is room for a bar and a label.
 *
 * ```html
 * <ds-progress-circle label="Uploading report.pdf" [value]="64" />
 * <ds-progress-circle label="Syncing" [value]="null" size="sm" />
 * <ds-progress-circle label="Storage used" [value]="72" size="lg" showValue />
 * ```
 *
 * `role="progressbar"` named by `label`, with `aria-valuenow` (left out while indeterminate) and
 * `data-state` (`indeterminate`, `loading`, `complete`). The stroke dash transitions on value
 * change. React has no ProgressCircle yet: it is designed from the roadmap entry.
 */
@Component({
  selector: 'ds-progress-circle',
  template: `
    <svg class="progress-circle-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle class="progress-circle-track" cx="12" cy="12" r="10" />
      <circle
        class="progress-circle-indicator"
        cx="12"
        cy="12"
        r="10"
        pathLength="100"
        [attr.data-state]="state()"
        [attr.data-empty]="percentage() === 0 ? '' : null"
      />
    </svg>
    @if (showValue() && valueText(); as text) {
      <span class="progress-circle-value" aria-hidden="true">{{ text }}</span>
    }
  `,
  styleUrl: './progress-circle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    'aria-valuemin': '0',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'state() === "indeterminate" ? null : value()',
    '[attr.aria-valuetext]': 'valueText()',
    '[attr.aria-label]': 'label()',
    '[attr.data-state]': 'state()',
    '[attr.data-size]': 'size()',
    '[style.--pada-progress-circle-percentage]': 'percentage() ?? 0',
  },
})
export class ProgressCircleComponent {
  /** Current value, from 0 to `max`. `null` (the default) spins indeterminately. */
  readonly value = input<number | null>(null);
  /** The value that means done. @default 100 */
  readonly max = input(100);
  /** Accessible name. Required: the ring has no visible text of its own. */
  readonly label = input.required<string>();
  /** sm 16px, md 24px, lg 48px. @default 'md' */
  readonly size = input<ProgressCircleSize>('md');
  /** Shows the percentage inside the ring. Only legible at `lg`. */
  readonly showValue = input(false, { transform: booleanAttribute });

  protected readonly percentage = computed(() => progressPercentage(this.value(), this.max()));
  protected readonly state = computed(() => progressState(this.percentage()));
  protected readonly valueText = computed(() => {
    const percentage = this.percentage();
    return percentage === null ? null : `${Math.round(percentage)}%`;
  });
}
