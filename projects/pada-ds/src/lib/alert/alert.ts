import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { IconComponent } from '../icon/icon';

export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type AlertLive = 'polite' | 'assertive';

const TONE_ICON: Record<AlertTone, string> = {
  neutral: 'info',
  info: 'info',
  success: 'tick_2',
  warning: 'alert_1',
  danger: 'alert_2',
};

/**
 * An inline, persistent message: a callout in a form or page, not a transient toast.
 *
 * ```html
 * <ds-alert tone="danger" live="assertive" title="Payment failed" dismissible (dismiss)="clear()">
 *   Check your card details and try again.
 *   <button dsButton dsAlertActions variant="secondary" size="sm">Update card</button>
 * </ds-alert>
 * ```
 *
 * Project buttons or links with the `dsAlertActions` attribute to show them under the message.
 *
 * Differences from React: the dismiss button shows with `dismissible` and reports through the
 * `dismiss` output (React shows it when `onDismiss` is passed). `title` sets the heading only:
 * it never becomes the host's native tooltip.
 */
@Component({
  selector: 'ds-alert',
  imports: [IconComponent],
  template: `
    @if (iconName(); as name) {
      <ds-icon class="alert-icon" [name]="name" [size]="16" />
    }
    <div class="alert-body">
      @if (title()) {
        <p class="alert-title">{{ title() }}</p>
      }
      <div class="alert-description"><ng-content /></div>
      <div class="alert-actions"><ng-content select="[dsAlertActions]" /></div>
    </div>
    @if (dismissible()) {
      <button type="button" class="alert-dismiss" aria-label="Dismiss" (click)="dismiss.emit()">
        <ds-icon name="cross_1" [size]="14" />
      </button>
    }
  `,
  styleUrl: './alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'role()',
    '[attr.data-tone]': 'tone()',
    '[attr.title]': 'null',
  },
})
export class AlertComponent {
  /** Colour and default icon by meaning. @default 'info' */
  readonly tone = input<AlertTone>('info');
  /** Bold first line. */
  readonly title = input<string>();
  /** Built-in icon name; `false` hides the icon. Defaults to one that matches the tone. */
  readonly icon = input<string | false>();
  /** Shows a dismiss button that emits `dismiss`. */
  readonly dismissible = input(false, { transform: booleanAttribute });
  /**
   * Announce the alert when it appears: `polite` (`role="status"`) or `assertive`
   * (`role="alert"`, for errors that need immediate attention). Leave unset for alerts present
   * on page load.
   */
  readonly live = input<AlertLive>();
  /** The dismiss button was pressed. Remove the alert in response. */
  readonly dismiss = output<void>();

  protected readonly role = computed(() => {
    const live = this.live();
    return live === 'assertive' ? 'alert' : live === 'polite' ? 'status' : null;
  });
  protected readonly iconName = computed(() => {
    const icon = this.icon();
    return icon === false ? null : (icon ?? TONE_ICON[this.tone()]);
  });
}
