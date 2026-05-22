import { Component, Input } from '@angular/core';
import { AvatarComponent } from '../../../avatar/avatar';

@Component({
  selector: 'ds-attribute-avatar-value',
  standalone: true,
  imports: [AvatarComponent],
  template: `
    <div class="attr-row__avatar-lockup">
      <ds-avatar [data]="{ src: data.src, initials: data.initials, alt: data.name }" />
      <div class="attr-row__avatar-info">
        <span class="attr-row__avatar-name">{{ data.name }}</span>
        @if (data.subtitle) {
          <span class="attr-row__avatar-subtitle">{{ data.subtitle }}</span>
        }
      </div>
    </div>
  `,
})
export class AttributeAvatarValueComponent {
  @Input({ required: true }) data!: { type: 'avatar'; name: string; initials?: string; src?: string; subtitle?: string };
}
