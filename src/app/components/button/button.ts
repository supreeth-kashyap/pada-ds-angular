import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ButtonData {
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'ds-button',
  standalone: true,
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class ButtonComponent {
  @Input({ required: true }) data!: ButtonData;
  @Output() clicked = new EventEmitter<void>();

  protected handleClick(): void {
    if (!this.data.disabled) {
      this.clicked.emit();
    }
  }
}
