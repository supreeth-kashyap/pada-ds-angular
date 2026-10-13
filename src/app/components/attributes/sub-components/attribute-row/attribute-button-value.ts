import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ButtonComponent } from '../../../button/button';

@Component({
  selector: 'ds-attribute-button-value',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ds-button
      [data]="{ label: data().label, disabled: data().disabled }"
      (clicked)="onClicked()?.()"
    />
  `,
})
export class AttributeButtonValueComponent {
  readonly data = input.required<{ type: 'button'; label: string; disabled?: boolean }>();
  readonly onClicked = input<() => void>();
}
