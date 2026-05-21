import { Component, Input } from '@angular/core';

export interface BadgeData {
  label: string;
  icon?: string; // icon name from ds-icon library; renders icon slot when provided
}

@Component({
  selector: 'ds-badge',
  standalone: true,
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
})
export class BadgeComponent {
  @Input({ required: true }) data!: BadgeData;
}
