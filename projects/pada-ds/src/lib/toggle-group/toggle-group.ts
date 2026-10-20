import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DsToggleGroup, DsToggleGroupItem } from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';
import { ToggleSize } from '../toggle/toggle';

/**
 * A segmented set of toggles with one tab stop and arrow-key movement. `single` presses one
 * item (value: a string, `''` when cleared); `multiple` presses any number (value: a string
 * array). Works with Angular forms or through `[(value)]`. Name it with `aria-label`.
 *
 * ```html
 * <ds-toggle-group type="single" [(value)]="view" aria-label="View">
 *   <button dsToggleGroupItem value="list" icon="menu_2">List</button>
 *   <button dsToggleGroupItem value="board" icon="area">Board</button>
 * </ds-toggle-group>
 * ```
 */
@Component({
  selector: 'ds-toggle-group',
  template: '<ng-content />',
  styleUrl: './toggle-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: DsToggleGroup,
      inputs: ['type', 'value', 'orientation', 'loop', 'disabled', 'dir'],
      outputs: ['valueChange'],
    },
  ],
  host: {
    class: 'toggle-group',
    '[attr.data-size]': 'size()',
  },
})
export class ToggleGroupComponent {
  /** Item height: sm 28px, md 32px, lg 40px. @default 'md' */
  readonly size = input<ToggleSize>('md');
}

/**
 * One item in a `ds-toggle-group`, styled like a toggle. It includes the headless
 * `DsToggleGroupItem`; do not also import that directive in the same template.
 */
@Component({
  selector: 'button[dsToggleGroupItem]',
  imports: [IconComponent],
  template: `@if (icon(); as icon) {
      <ds-icon [name]="icon" [size]="16" />
    }
    <ng-content />`,
  styleUrl: '../toggle/toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsToggleGroupItem, inputs: ['value', 'disabled'] }],
  host: { class: 'toggle' },
})
export class ToggleGroupItemComponent {
  /** Built-in icon name shown before the label. Icon-only items need an `aria-label`. */
  readonly icon = input<string>();
}

/** The toggle group parts, for `imports: [...ToggleGroupParts]`. */
export const ToggleGroupParts = [ToggleGroupComponent, ToggleGroupItemComponent] as const;
