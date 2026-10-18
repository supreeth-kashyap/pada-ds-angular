import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BadgeComponent } from 'pada-ds-angular';
import { ButtonComponent } from 'pada-ds-angular';
import { InfoTooltipComponent } from 'pada-ds-angular';

export type SectionSlotItem =
  | { type: 'button'; label: string; disabled?: boolean }
  | { type: 'badge'; label: string };

export interface SectionHeaderData {
  label: string;
  tooltip?: string;
  slot?: SectionSlotItem[];
}

@Component({
  selector: 'ds-section-header',
  standalone: true,
  imports: [BadgeComponent, ButtonComponent, InfoTooltipComponent],
  templateUrl: './section-header.html',
  styleUrl: './section-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderComponent {
  readonly data = input.required<SectionHeaderData>();
  readonly slotClicked = output<SectionSlotItem>();
}
