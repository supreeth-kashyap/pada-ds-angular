import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BadgeComponent } from '../../../badge/badge';
import { ButtonComponent } from '../../../button/button';

export type SectionSlotItem =
  | { type: 'button'; label: string; disabled?: boolean }
  | { type: 'badge'; label: string; icon?: string };

export interface SectionHeaderData {
  label: string;
  tooltip?: string;
  slot?: SectionSlotItem[];
}

@Component({
  selector: 'ds-section-header',
  standalone: true,
  imports: [BadgeComponent, ButtonComponent],
  templateUrl: './section-header.html',
  styleUrl: './section-header.scss',
})
export class SectionHeaderComponent {
  @Input({ required: true }) data!: SectionHeaderData;
  @Output() slotClicked = new EventEmitter<SectionSlotItem>();
}
