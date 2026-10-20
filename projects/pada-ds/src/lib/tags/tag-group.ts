import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DsTagGroup } from 'pada-ds-angular/headless';
import { TagsComponent } from './tags';

/**
 * A wrapping list of tags with one tab stop. Arrow keys move between the tags' remove buttons,
 * Home/End jump to the ends, Delete or Backspace removes the focused tag, and focus moves to the
 * next tag (else the previous, else the group) once it is gone.
 *
 * ```html
 * <ds-tag-group label="Filters">
 *   @for (filter of filters(); track filter) {
 *     <ds-tag removable (remove)="drop(filter)">{{ filter }}</ds-tag>
 *   }
 * </ds-tag-group>
 * ```
 *
 * `role="list"` with each tag a `listitem`. React has no TagGroup yet: it is designed from the
 * roadmap entry ("Tag (removable) + TagGroup").
 */
@Component({
  selector: 'ds-tag-group',
  template: '<ng-content />',
  styleUrl: './tag-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsTagGroup, inputs: ['loop', 'disabled', 'dir'] }],
  host: { '[attr.aria-label]': 'label() ?? null' },
})
export class TagGroupComponent {
  /** Accessible name of the list, e.g. "Filters". */
  readonly label = input<string>();
}

/** The tag parts, for `imports: [...TagGroupParts]`. */
export const TagGroupParts = [TagGroupComponent, TagsComponent] as const;
