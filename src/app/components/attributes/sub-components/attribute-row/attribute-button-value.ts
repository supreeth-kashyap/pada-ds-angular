import { Component, Input } from '@angular/core';
import { ButtonComponent } from '../../../button/button';

@Component({
  selector: 'ds-attribute-button-value',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <ds-button
      [data]="{ label: data.label, disabled: data.disabled }"
      (clicked)="onClicked?.()"
    />
  `,
})
export class AttributeButtonValueComponent {
  @Input({ required: true }) data!: { type: 'button'; label: string; disabled?: boolean };
  @Input() onClicked?: () => void;
}
