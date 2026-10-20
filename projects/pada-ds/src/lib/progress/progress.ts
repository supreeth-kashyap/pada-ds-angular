import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { uniqueId } from 'pada-ds-angular/headless';
import { progressPercentage, progressState } from './progress-value';

/**
 * A progress bar: determinate with a `value`, or indeterminate (a sweeping fill, no
 * `aria-valuenow`) while `value` is `null`.
 *
 * ```html
 * <ds-progress label="Uploading" [value]="42" showValue />
 * <ds-progress label="Preparing export" [value]="null" />
 * ```
 *
 * State is exposed as `data-state` (`indeterminate`, `loading`, `complete`) on the host and the
 * track. Differences from React: `role="progressbar"` sits on the track and is named by `label`
 * (React puts it on the fill and leaves it unnamed), the fill is clamped to 0–100%, and the
 * indeterminate state and `showValue` come from the roadmap (React has neither yet).
 */
@Component({
  selector: 'ds-progress',
  template: `
    @if (label() || showValue()) {
      <span class="progress-header">
        @if (label()) {
          <span class="progress-label" [id]="labelId">{{ label() }}</span>
        }
        @if (showValue() && valueText(); as text) {
          <span class="progress-value" aria-hidden="true">{{ text }}</span>
        }
      </span>
    }
    <div
      class="progress-bar"
      role="progressbar"
      aria-valuemin="0"
      [attr.aria-valuemax]="max()"
      [attr.aria-valuenow]="state() === 'indeterminate' ? null : value()"
      [attr.aria-valuetext]="valueText()"
      [attr.aria-labelledby]="label() ? labelId : null"
      [attr.aria-label]="label() ? null : ariaLabel()"
      [attr.data-state]="state()"
    >
      <div
        class="progress-indicator"
        [attr.data-state]="state()"
        [style.width.%]="percentage()"
      ></div>
    </div>
  `,
  styleUrl: './progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-state]': 'state()' },
})
export class ProgressComponent {
  /** Current value, from 0 to `max`. `null` shows an indeterminate bar. */
  readonly value = input.required<number | null>();
  /** The value that means done. @default 100 */
  readonly max = input(100);
  /** Visible label above the bar; also its accessible name. */
  readonly label = input<string>();
  /** Accessible name when there is no visible `label`. @default 'Progress' */
  readonly ariaLabel = input('Progress');
  /** Shows the percentage at the end of the label row. */
  readonly showValue = input(false, { transform: booleanAttribute });

  protected readonly labelId = uniqueId('ds-progress-label-');
  protected readonly percentage = computed(() => progressPercentage(this.value(), this.max()));
  protected readonly state = computed(() => progressState(this.percentage()));
  protected readonly valueText = computed(() => {
    const percentage = this.percentage();
    return percentage === null ? null : `${Math.round(percentage)}%`;
  });
}
