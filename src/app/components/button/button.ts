import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface ButtonData {
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'ds-button',
  standalone: true,
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly data = input.required<ButtonData>();
  readonly clicked = output<void>();

  protected handleClick(): void {
    if (!this.data().disabled) {
      this.clicked.emit();
    }
  }
}
