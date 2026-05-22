import { Component, Input } from '@angular/core';

@Component({
  selector: 'ds-attribute-text-value',
  standalone: true,
  template: `<span class="attr-row__text">{{ data.text }}</span>`,
})
export class AttributeTextValueComponent {
  @Input({ required: true }) data!: { type: 'text'; text: string };
}
