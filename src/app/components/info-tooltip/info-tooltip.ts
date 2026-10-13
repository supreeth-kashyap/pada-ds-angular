import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { InfoIconComponent } from '../info-icon/info-icon';

export interface InfoTooltipData {
  label: string; // what the tooltip describes; used in the trigger's accessible name
  text: string;
}

let nextId = 0;

@Component({
  selector: 'ds-info-tooltip',
  standalone: true,
  imports: [InfoIconComponent],
  templateUrl: './info-tooltip.html',
  styleUrl: './info-tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(document:keydown.escape)': 'dismiss()',
  },
})
export class InfoTooltipComponent {
  readonly data = input.required<InfoTooltipData>();

  protected readonly tooltipId = `ds-info-tooltip-${nextId++}`;
  protected readonly ariaLabel = computed(() => `More info about ${this.data().label}`);

  private readonly focused = signal(false);
  private readonly hovered = signal(false);
  private readonly dismissed = signal(false);

  // Hover is tracked on the host, so pointer users can move onto the tooltip text without it closing.
  protected readonly open = computed(() => (this.focused() || this.hovered()) && !this.dismissed());

  protected onFocus(): void {
    this.focused.set(true);
    this.dismissed.set(false);
  }

  protected onBlur(): void {
    this.focused.set(false);
  }

  protected onMouseEnter(): void {
    this.hovered.set(true);
    this.dismissed.set(false);
  }

  protected onMouseLeave(): void {
    this.hovered.set(false);
  }

  protected dismiss(): void {
    this.dismissed.set(true);
  }
}
