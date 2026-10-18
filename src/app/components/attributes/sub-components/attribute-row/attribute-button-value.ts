import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ButtonComponent } from 'pada-ds-angular';

@Component({
  selector: 'ds-attribute-button-value',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button dsButton variant="secondary" size="sm" [disabled]="data().disabled ?? false" (click)="onClicked()?.()">
      {{ data().label }}
    </button>
  `,
})
export class AttributeButtonValueComponent {
  readonly data = input.required<{ type: 'button'; label: string; disabled?: boolean }>();
  readonly onClicked = input<() => void>();
}
