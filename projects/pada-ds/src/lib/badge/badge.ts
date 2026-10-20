import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeVariant = 'subtle' | 'solid' | 'outline';
export type BadgeSize = 'sm' | 'md';

/**
 * A short status label or a count: "Beta", "Overdue", "12". For removable or clickable labels
 * use `ds-tags`.
 *
 * ```html
 * <ds-badge tone="success" dot>Active</ds-badge>
 * <ds-badge tone="danger" variant="solid" size="sm" [count]="unread()" />
 * ```
 *
 * A `count` replaces the projected label and bumps briefly whenever it changes.
 */
@Component({
  selector: 'ds-badge',
  template: `
    @if (dot()) {
      <span class="badge-dot" aria-hidden="true"></span>
    }
    @if (countText(); as text) {
      <!-- Re-created per value, so a new count re-runs the bump animation. -->
      @for (value of [text]; track value) {
        <span class="badge-label" data-count>{{ value }}</span>
      }
    } @else {
      <span class="badge-label"><ng-content /></span>
    }
  `,
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
  },
})
export class BadgeComponent {
  /** Colour by meaning. @default 'neutral' */
  readonly tone = input<BadgeTone>('neutral');
  /** `subtle` (tinted), `solid` (filled) or `outline`. @default 'subtle' */
  readonly variant = input<BadgeVariant>('subtle');
  /** `sm` for counts and dense tables, `md` otherwise. @default 'md' */
  readonly size = input<BadgeSize>('md');
  /** A numeric count. Replaces the projected label; bumps briefly when it changes. */
  readonly count = input<number>();
  /** Counts above this show as "max+". @default 99 */
  readonly max = input(99);
  /** Shows a leading status dot. */
  readonly dot = input(false, { transform: booleanAttribute });

  protected readonly countText = computed(() => {
    const count = this.count();
    if (count === undefined || count === null) return null;
    return count > this.max() ? `${this.max()}+` : String(count);
  });
}
