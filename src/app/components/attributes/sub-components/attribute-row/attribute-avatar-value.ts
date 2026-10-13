import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AvatarComponent } from '../../../avatar/avatar';

@Component({
  selector: 'ds-attribute-avatar-value',
  standalone: true,
  imports: [AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="attr-row__avatar-lockup">
      <ds-avatar [data]="{ src: data().src, initials: data().initials, alt: data().name }" />
      <div class="attr-row__avatar-info">
        <span class="attr-row__avatar-name">{{ data().name }}</span>
        @if (data().subtitle) {
          <span class="attr-row__avatar-subtitle">{{ data().subtitle }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .attr-row__avatar-lockup {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 8px;
    }

    .attr-row__avatar-info {
      display: flex;
      flex-direction: column;
    }

    .attr-row__avatar-name {
      font-family: 'Open Sans', sans-serif;
      font-weight: 700;
      font-size: 14px;
      line-height: 20px;
      color: #1a1a1a;
    }

    .attr-row__avatar-subtitle {
      font-family: 'Open Sans', sans-serif;
      font-weight: 400;
      font-size: 14px;
      line-height: 20px;
      color: #1a1a1a;
    }
  `],
})
export class AttributeAvatarValueComponent {
  readonly data = input.required<{ type: 'avatar'; name: string; initials?: string; src?: string; subtitle?: string }>();
}
