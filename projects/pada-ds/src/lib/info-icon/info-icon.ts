import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ds-info-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="6" r="5.5" stroke="currentColor"/>
      <path d="M6 5.5V8.5" stroke="currentColor" stroke-linecap="round"/>
      <circle cx="6" cy="3.75" r="0.5" fill="currentColor"/>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    svg {
      width: 12px;
      height: 12px;
    }
  `],
})
export class InfoIconComponent {}
