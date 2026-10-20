import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon';

export type TagsVariant = 'neutral' | 'primary' | 'secondary' | 'success' | 'danger' | 'royal';

/**
 * A tinted label for categories and metadata ("Design", "Q3", "Owner: Ada").
 *
 * ```html
 * <ds-tags variant="success" icon="tick_1">Approved</ds-tags>
 * ```
 *
 * For a custom leading visual (an image, an emoji), project it with the `dsTagsIcon` attribute.
 *
 * Differences from React: the deprecated hue aliases (`gray`, `blue`, `red`, …) are not
 * supported; use the six variants.
 */
@Component({
  selector: 'ds-tags',
  imports: [IconComponent],
  template: `
    @if (icon(); as icon) {
      <ds-icon class="tags-icon" [name]="icon" [size]="12" />
    }
    <span class="tags-icon tags-icon-slot"><ng-content select="[dsTagsIcon]" /></span>
    <span class="tags-content"><ng-content /></span>
  `,
  styleUrl: './tags.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-variant]': 'variant()' },
})
export class TagsComponent {
  /** Tint: hue-50 background, hue-100 border, hue-700 text. @default 'neutral' */
  readonly variant = input<TagsVariant>('neutral');
  /** Built-in or Material Symbols icon name before the label. */
  readonly icon = input<string>();
}
