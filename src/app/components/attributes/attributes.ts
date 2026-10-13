import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SectionHeaderComponent, SectionHeaderData, SectionSlotItem } from './sub-components/section-header/section-header';
import {
  AttributeRowButtonClick,
  AttributeRowComponent,
  AttributeRowData,
} from './sub-components/attribute-row/attribute-row';

export interface AttributeSection {
  header: SectionHeaderData;
  rows: AttributeRowData[];
}

export interface AttributesData {
  sections: AttributeSection[];
}

export type AttributesEvent =
  | { type: 'section-slot-click'; sectionLabel: string; item: SectionSlotItem }
  | { type: 'row-button-click'; sectionLabel: string; key: string; label: string; index: number };

@Component({
  selector: 'ds-attributes',
  standalone: true,
  imports: [SectionHeaderComponent, AttributeRowComponent],
  templateUrl: './attributes.html',
  styleUrl: './attributes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributesComponent {
  readonly data = input.required<AttributesData>();
  readonly action = output<AttributesEvent>();

  protected onSectionSlotClicked(sectionLabel: string, item: SectionSlotItem): void {
    this.action.emit({ type: 'section-slot-click', sectionLabel, item });
  }

  protected onRowButtonClicked(sectionLabel: string, key: string, click: AttributeRowButtonClick): void {
    this.action.emit({ type: 'row-button-click', sectionLabel, key, label: click.label, index: click.index });
  }
}
