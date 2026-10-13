import { Component, EventEmitter, Input, Output, TemplateRef, Type } from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { BadgeComponent } from '../../../badge/badge';
import { InfoIconComponent } from '../../../info-icon/info-icon';
import { AttributeTextValueComponent } from './attribute-text-value';
import { AttributeAvatarValueComponent } from './attribute-avatar-value';
import { AttributeButtonValueComponent } from './attribute-button-value';

export type AttributeValue =
  | { type: 'text'; text: string }
  | { type: 'avatar'; name: string; initials?: string; src?: string; subtitle?: string }
  | { type: 'badge'; label: string; icon?: string }
  | { type: 'button'; label: string; disabled?: boolean }
  | { type: 'custom'; component: Type<unknown>; inputs?: Record<string, unknown> }
  | { type: 'template'; template: TemplateRef<unknown>; context?: unknown };

export interface AttributeRowData {
  key: string;
  tooltip?: string;
  value: AttributeValue[];
}

type RegistryValue = Exclude<AttributeValue, { type: 'custom' } | { type: 'template' }>;

const ATTRIBUTE_VALUE_REGISTRY: Record<RegistryValue['type'], Type<unknown>> = {
  text: AttributeTextValueComponent,
  avatar: AttributeAvatarValueComponent,
  badge: BadgeComponent,
  button: AttributeButtonValueComponent,
};

@Component({
  selector: 'ds-attribute-row',
  standalone: true,
  imports: [NgComponentOutlet, NgTemplateOutlet, InfoIconComponent],
  templateUrl: './attribute-row.html',
  styleUrl: './attribute-row.scss',
})
export class AttributeRowComponent {
  @Input({ required: true }) data!: AttributeRowData;
  @Output() buttonClicked = new EventEmitter<void>();

  isTemplate(val: AttributeValue): val is { type: 'template'; template: TemplateRef<unknown>; context?: unknown } {
    return val.type === 'template';
  }

  resolveComponent(val: Exclude<AttributeValue, { type: 'template' }>): Type<unknown> {
    if (val.type === 'custom') return val.component;
    return ATTRIBUTE_VALUE_REGISTRY[val.type];
  }

  resolveInputs(val: Exclude<AttributeValue, { type: 'template' }>): Record<string, unknown> {
    switch (val.type) {
      case 'text':
      case 'avatar':
        return { data: val };
      case 'badge':
        return { data: { label: val.label, icon: val.icon } };
      case 'button':
        return { data: val, onClicked: () => this.buttonClicked.emit() };
      case 'custom':
        return val.inputs ?? {};
    }
  }
}
