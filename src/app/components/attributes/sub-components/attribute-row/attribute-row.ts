import { ChangeDetectionStrategy, Component, TemplateRef, Type, computed, input, output } from '@angular/core';
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

export interface AttributeRowButtonClick {
  label: string;
  index: number; // position of the clicked button within `AttributeRowData.value`
}

type RegistryValue = Exclude<AttributeValue, { type: 'custom' } | { type: 'template' }>;

type ResolvedValue =
  | { kind: 'template'; template: TemplateRef<unknown>; context?: unknown }
  | { kind: 'component'; component: Type<unknown>; inputs: Record<string, unknown> };

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeRowComponent {
  readonly data = input.required<AttributeRowData>();
  readonly buttonClicked = output<AttributeRowButtonClick>();

  // Resolved once per `data` change, so outlet inputs (and button click closures) keep their identity across renders.
  protected readonly resolvedValues = computed<ResolvedValue[]>(() =>
    this.data().value.map((val, index) => this.resolve(val, index)),
  );

  private resolve(val: AttributeValue, index: number): ResolvedValue {
    switch (val.type) {
      case 'template':
        return { kind: 'template', template: val.template, context: val.context };
      case 'custom':
        return { kind: 'component', component: val.component, inputs: val.inputs ?? {} };
      case 'text':
      case 'avatar':
        return { kind: 'component', component: ATTRIBUTE_VALUE_REGISTRY[val.type], inputs: { data: val } };
      case 'badge':
        return {
          kind: 'component',
          component: ATTRIBUTE_VALUE_REGISTRY.badge,
          inputs: { data: { label: val.label, icon: val.icon } },
        };
      case 'button':
        return {
          kind: 'component',
          component: ATTRIBUTE_VALUE_REGISTRY.button,
          inputs: { data: val, onClicked: () => this.buttonClicked.emit({ label: val.label, index }) },
        };
    }
  }
}
