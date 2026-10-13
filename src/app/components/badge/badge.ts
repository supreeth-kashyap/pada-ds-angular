import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface BadgeData {
  label: string;
  // no `icon` until the design system ships an icon set
}

@Component({
  selector: 'ds-badge',
  standalone: true,
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  readonly data = input.required<BadgeData>();
}
