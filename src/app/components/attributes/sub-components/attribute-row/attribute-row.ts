import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AvatarComponent } from '../../../avatar/avatar';
import { BadgeComponent } from '../../../badge/badge';
import { ButtonComponent } from '../../../button/button';

export type AttributeValue =
  | { type: 'text'; text: string }
  | { type: 'avatar'; name: string; initials?: string; src?: string; subtitle?: string }
  | { type: 'badge'; label: string; icon?: string }
  | { type: 'button'; label: string; disabled?: boolean };

export interface AttributeRowData {
  key: string;
  tooltip?: string;
  value: AttributeValue[];
}

@Component({
  selector: 'ds-attribute-row',
  standalone: true,
  imports: [AvatarComponent, BadgeComponent, ButtonComponent],
  templateUrl: './attribute-row.html',
  styleUrl: './attribute-row.scss',
})
export class AttributeRowComponent {
  @Input({ required: true }) data!: AttributeRowData;
  @Output() buttonClicked = new EventEmitter<void>();
}
