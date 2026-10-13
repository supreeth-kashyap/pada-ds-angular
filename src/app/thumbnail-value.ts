import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface ThumbnailValueData {
  text: string;
  imageUrl: string;
  imageAlt?: string;
}

@Component({
  selector: 'app-thumbnail-value',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="thumbnail-value">
      <img
        class="thumbnail-value__img"
        [src]="data().imageUrl"
        [alt]="data().imageAlt ?? data().text"
      />
      <span class="thumbnail-value__text">{{ data().text }}</span>
    </div>
  `,
  styles: [`
    .thumbnail-value {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .thumbnail-value__img {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .thumbnail-value__text {
      font-family: 'Open Sans', sans-serif;
      font-size: 14px;
      line-height: 20px;
      color: #1a1a1a;
    }
  `],
})
export class ThumbnailValueComponent {
  readonly data = input.required<ThumbnailValueData>();
}
