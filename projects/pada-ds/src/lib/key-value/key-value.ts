import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InfoTooltipComponent } from '../info-tooltip/info-tooltip';

/**
 * A label on the left and a value on the right, for settings and detail panels.
 *
 * ```html
 * <ds-key-value label="Owner" infoTooltip="Who approves changes">
 *   <ds-avatar name="Ada Lovelace" size="sm" /> Ada Lovelace
 * </ds-key-value>
 * ```
 *
 * Projected content is the value. To replace the label text with your own markup, project it
 * with the `dsKeyValueLabel` attribute. For many rows from data, use `ds-description-list`.
 *
 * Differences from React: the info tooltip uses `ds-info-tooltip` (named "More info about
 * <label>") until the Pada tooltip lands in Angular; a custom label is projected rather than
 * passed as `labelComponent`.
 */
@Component({
  selector: 'ds-key-value',
  imports: [InfoTooltipComponent],
  template: `
    <div class="key-value-label-section">
      <ng-content select="[dsKeyValueLabel]">
        <span class="key-value-label">{{ label() }}</span>
      </ng-content>
      @if (infoTooltip(); as text) {
        <ds-info-tooltip [data]="{ label: label(), text: text }" />
      }
    </div>
    <div class="key-value-value-section"><ng-content /></div>
  `,
  styleUrl: './key-value.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyValueComponent {
  /** The key, shown on the left. */
  readonly label = input.required<string>();
  /** Help text behind an info button next to the label. No button without it. */
  readonly infoTooltip = input<string>();
}
