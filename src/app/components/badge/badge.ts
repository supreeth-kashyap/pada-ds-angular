import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface BadgeData {
  label: string;
  icon?: string; // icon name from ds-icon library; renders icon slot when provided
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
