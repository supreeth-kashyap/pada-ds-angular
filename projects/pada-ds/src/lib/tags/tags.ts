import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { DsTagGroup, DsTagGroupItem, uniqueId } from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

export type TagsVariant = 'neutral' | 'primary' | 'secondary' | 'success' | 'danger' | 'royal';
/** The 2.0 name of `TagsVariant`. */
export type TagVariant = TagsVariant;

/**
 * A tinted label for categories and metadata ("Design", "Q3", "Owner: Ada"). Also available as
 * `ds-tag`, its 2.0 name.
 *
 * ```html
 * <ds-tags variant="success" icon="tick_1">Approved</ds-tags>
 * <ds-tag removable (remove)="drop('design')">Design</ds-tag>
 * ```
 *
 * For a custom leading visual (an image, an emoji), project it with the `dsTagsIcon` attribute.
 * `removable` adds a remove button named "Remove <label>"; it emits `remove` on click and on
 * Delete or Backspace, and the consumer takes the tag out. Inside a `ds-tag-group` the tag is a
 * list item and its remove button joins the group's arrow-key navigation.
 *
 * Differences from React: the deprecated hue aliases (`gray`, `blue`, `red`, …) are not
 * supported; use the six variants. `removable` and `ds-tag` come from the roadmap (React's Tags
 * has neither yet). A removed tag leaves without the roadmap's collapse motion, since the
 * consumer's `@for` removes it.
 */
@Component({
  selector: 'ds-tags, ds-tag',
  imports: [IconComponent, DsTagGroupItem],
  template: `
    @if (icon(); as icon) {
      <ds-icon class="tags-icon" [name]="icon" [size]="12" />
    }
    <span class="tags-icon tags-icon-slot"><ng-content select="[dsTagsIcon]" /></span>
    <span class="tags-content" [id]="contentId"><ng-content /></span>
    @if (removable()) {
      <button
        dsTagGroupItem
        class="tags-remove"
        [id]="removeId"
        [disabled]="disabled()"
        [attr.aria-label]="removeLabel()"
        [attr.aria-labelledby]="removeId + ' ' + contentId"
        (remove)="remove.emit()"
      >
        <ds-icon name="cross_1" [size]="12" />
      </button>
    }
  `,
  styleUrl: './tags.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-removable]': 'removable() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.role]': 'group ? "listitem" : null',
  },
})
export class TagsComponent {
  /** Tint: hue-50 background, hue-100 border, hue-700 text. @default 'neutral' */
  readonly variant = input<TagsVariant>('neutral');
  /** Built-in or Material Symbols icon name before the label. */
  readonly icon = input<string>();
  /** Adds a remove button after the label. */
  readonly removable = input(false, { transform: booleanAttribute });
  /** The verb of the remove button's name; the tag's label follows it. @default 'Remove' */
  readonly removeLabel = input('Remove');
  /** Disables the remove button. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The remove button was pressed (click, Delete or Backspace). Take the tag out. */
  readonly remove = output<void>();

  protected readonly group = inject(DsTagGroup, { optional: true });
  protected readonly contentId = uniqueId('ds-tag-label-');
  protected readonly removeId = uniqueId('ds-tag-remove-');
  protected readonly isDisabled = computed(
    () => this.disabled() || (this.group?.disabled() ?? false),
  );
}

/** The 2.0 name of `TagsComponent` (`ds-tag`). */
export const TagComponent = TagsComponent;
export type TagComponent = TagsComponent;
