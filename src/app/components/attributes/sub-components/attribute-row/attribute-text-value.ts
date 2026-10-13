import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ds-attribute-text-value',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="attr-row__text">{{ data().text }}</span>`,
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
  readonly data = input.required<{ type: 'text'; text: string }>();
}
