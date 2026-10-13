import { Component, Input } from '@angular/core';

@Component({
  selector: 'ds-attribute-text-value',
  standalone: true,
  template: `<span class="attr-row__text">{{ data.text }}</span>`,
  styles: [`
    :host {
      display: inline-flex;
    }

    .attr-row__text {
      font-family: 'Antique Legacy', sans-serif;
      font-weight: 400;
      font-size: 14px;
      line-height: 20px;
      color: #000000;
    }
  `],
})
export class AttributeTextValueComponent {
  @Input({ required: true }) data!: { type: 'text'; text: string };
}
