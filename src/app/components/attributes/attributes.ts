import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SectionHeaderComponent, SectionHeaderData, SectionSlotItem } from './sub-components/section-header/section-header';
import { AttributeRowComponent, AttributeRowData } from './sub-components/attribute-row/attribute-row';

export interface AttributeSection {
  header: SectionHeaderData;
  rows: AttributeRowData[];
}

export interface AttributesData {
  sections: AttributeSection[];
}

export type AttributesEvent =
  | { type: 'section-slot-click'; sectionLabel: string; item: SectionSlotItem }
  | { type: 'row-button-click'; sectionLabel: string; key: string };

@Component({
  selector: 'ds-attributes',
  standalone: true,
  imports: [SectionHeaderComponent, AttributeRowComponent],
  templateUrl: './attributes.html',
  styleUrl: './attributes.scss',
})
export class AttributesComponent {
  @Input({ required: true }) data!: AttributesData;
  @Output() action = new EventEmitter<AttributesEvent>();

  protected onSectionSlotClicked(sectionLabel: string, item: SectionSlotItem): void {
    this.action.emit({ type: 'section-slot-click', sectionLabel, item });
  }

  protected onRowButtonClicked(sectionLabel: string, key: string): void {
    this.action.emit({ type: 'row-button-click', sectionLabel, key });
  }
}
