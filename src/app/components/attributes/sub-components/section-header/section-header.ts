import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BadgeComponent } from '../../../badge/badge';
import { ButtonComponent } from '../../../button/button';
import { InfoIconComponent } from '../../../info-icon/info-icon';

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
  imports: [BadgeComponent, ButtonComponent, InfoIconComponent],
  templateUrl: './section-header.html',
  styleUrl: './section-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderComponent {
  readonly data = input.required<SectionHeaderData>();
  readonly slotClicked = output<SectionSlotItem>();
}
