import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { DsVisuallyHidden, uniqueId } from 'pada-ds-angular/headless';
import { animatedNumber } from './animated-number';

export type StatTrend = 'up' | 'down' | 'neutral';
export type StatSize = 'sm' | 'md' | 'lg';

const TREND_WORD: Record<StatTrend, string> = { up: 'up', down: 'down', neutral: 'unchanged' };

/**
 * A key figure (KPI): a label, a big value that counts to its new number when it changes, an
 * optional delta coloured by whether the change is good, a description and a chart slot.
 *
 * ```html
 * <ds-stat
 *   label="Revenue"
 *   [value]="128400"
 *   [formatOptions]="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
 *   [delta]="0.124"
 *   [deltaFormatOptions]="{ style: 'percent', maximumFractionDigits: 1 }"
 *   deltaLabel="vs last month"
 * >
 *   <svg dsStatChart>…</svg>
 * </ds-stat>
 * ```
 *
 * Project a sparkline or small chart with the `dsStatChart` attribute. Screen readers get the
 * final value, never the frames of the count.
 *
 * Differences from React: `label`, `deltaLabel` and `description` are text; a non-numeric
 * `value` is a string.
 */
@Component({
  selector: 'ds-stat',
  imports: [DsVisuallyHidden],
  template: `
    <div class="stat-label" [id]="labelId">{{ label() }}</div>
    <div class="stat-value">
      @if (numeric() === null) {
        {{ value() }}
      } @else {
        <span aria-hidden="true">{{ animatedText() }}</span>
        <span dsVisuallyHidden>{{ valueText() }}</span>
      }
    </div>
    @if (delta() !== undefined) {
      <div
        class="stat-delta"
        [attr.data-trend]="resolvedTrend()"
        [attr.data-sentiment]="sentiment()"
      >
        <span class="stat-delta-badge">
          <svg
            class="stat-delta-arrow"
            viewBox="0 0 16 16"
            width="12"
            height="12"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M8 13V3M4 7l4-4 4 4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span dsVisuallyHidden>{{ trendWord() }}</span>
          {{ ' ' }}{{ deltaText() }}
        </span>
        @if (deltaLabel()) {
          <span class="stat-delta-label">{{ deltaLabel() }}</span>
        }
      </div>
    }
    @if (description()) {
      <div class="stat-description">{{ description() }}</div>
    }
    <div class="stat-chart"><ng-content select="[dsStatChart]" /></div>
  `,
  styleUrl: './stat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-labelledby]': 'labelId',
    '[attr.data-size]': 'size()',
  },
})
export class StatComponent {
  /** What the figure measures, e.g. "Revenue". Names the group. */
  readonly label = input.required<string>();
  /** A number (formatted and animated) or any text. */
  readonly value = input.required<number | string>();
  /** Number format for `value`: currency, percent, compact notation, units. */
  readonly formatOptions = input<Intl.NumberFormatOptions>();
  /** Locale for number formatting. Defaults to the browser's. */
  readonly locale = input<string>();
  /** Change since the comparison period, e.g. 0.125 with a percent format, or 12. */
  readonly delta = input<number>();
  /** Number format for `delta`. Defaults to `formatOptions`, always with a sign. */
  readonly deltaFormatOptions = input<Intl.NumberFormatOptions>();
  /** Comparison text after the delta, e.g. "vs last week". */
  readonly deltaLabel = input<string>();
  /** Direction of the delta. Defaults to the delta's sign. */
  readonly trend = input<StatTrend>();
  /** When going down is good (costs, errors, latency): down shows as positive. */
  readonly invertTrend = input(false, { transform: booleanAttribute });
  /** Help text under the value. */
  readonly description = input<string>();
  /** Count up from the previous value when it changes. @default true */
  readonly animate = input(true, { transform: booleanAttribute });
  /** Value size: sm, md or lg. @default 'md' */
  readonly size = input<StatSize>('md');

  protected readonly labelId = uniqueId('ds-stat-label-');

  protected readonly numeric = computed(() => {
    const value = this.value();
    return typeof value === 'number' ? value : null;
  });
  private readonly format = computed(
    () => new Intl.NumberFormat(this.locale(), this.formatOptions()),
  );
  private readonly formatDelta = computed(
    () =>
      new Intl.NumberFormat(this.locale(), {
        ...(this.deltaFormatOptions() ?? this.formatOptions()),
        signDisplay: 'exceptZero',
      }),
  );
  private readonly animated = animatedNumber(
    computed(() => this.numeric() ?? 0),
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
    computed(() => (this.animate() ? 480 : 0)),
  );

  protected readonly animatedText = computed(() => this.format().format(this.animated()));
  protected readonly valueText = computed(() => this.format().format(this.numeric() ?? 0));
  protected readonly deltaText = computed(() => this.formatDelta().format(this.delta() ?? 0));

  protected readonly resolvedTrend = computed<StatTrend>(() => {
    const delta = this.delta();
    return (
      this.trend() ?? (delta === undefined || delta === 0 ? 'neutral' : delta > 0 ? 'up' : 'down')
    );
  });
  protected readonly trendWord = computed(() => TREND_WORD[this.resolvedTrend()]);
  protected readonly sentiment = computed(() => {
    const trend = this.resolvedTrend();
    if (trend === 'neutral') return 'neutral';
    return (trend === 'up') !== this.invertTrend() ? 'positive' : 'negative';
  });
}
