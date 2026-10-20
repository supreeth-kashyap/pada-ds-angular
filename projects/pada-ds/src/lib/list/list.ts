import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  DsList,
  DsListAnnouncer,
  DsListDragHandle,
  DsListItem,
  DsListItemContent,
  DsVisuallyHidden,
} from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

/**
 * A vertical list of `ds-list-item`s, optionally reorderable: drag an item, or focus its handle,
 * press Space to lift it, move it with the arrow keys and press Space again to drop it (Escape
 * puts it back). Each step is announced.
 *
 * ```html
 * <ds-list draggable label="Tasks" (reorder)="order.set($event)">
 *   @for (id of order(); track id) {
 *     <ds-list-item [value]="id">{{ tasks[id] }}</ds-list-item>
 *   }
 * </ds-list>
 * ```
 *
 * Differences from React: the list does not reorder its projected items itself. `(reorder)`
 * (React's `onReorder`) emits the item `value`s in their new order; render the items in that
 * order and the DOM follows. Items are identified by `value` instead of React's `id`.
 */
@Component({
  selector: 'ds-list',
  imports: [DsListAnnouncer, DsVisuallyHidden],
  // The list role sits on an inner element, so the live region can be its sibling.
  template: `
    <div class="list" role="list" [attr.aria-label]="label() || null"><ng-content /></div>
    @if (list.draggable()) {
      <span dsVisuallyHidden dsListAnnouncer></span>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .list {
      /* Component tokens */
      --pada-list-width: 438px;
      --pada-list-bg: var(--pada-color-surface);

      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: var(--pada-list-width);
      max-width: 100%;
      background-color: var(--pada-list-bg);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsList, inputs: ['draggable'], outputs: ['reorder'] }],
  host: { '[attr.role]': 'null' },
})
export class ListComponent {
  protected readonly list = inject(DsList);
  /** Accessible name of the list. */
  readonly label = input<string>();
}

/** One row of a `ds-list`. In a draggable list it gets a handle for keyboard reordering. */
@Component({
  selector: 'ds-list-item',
  imports: [DsListDragHandle, DsListItemContent, IconComponent],
  template: `
    @if (item.list.draggable()) {
      <button dsListDragHandle class="list-item-drag">
        <ds-icon name="drag_vertical" [size]="12" />
      </button>
    }
    <div dsListItemContent class="list-item-content"><ng-content /></div>
  `,
  styleUrl: './list-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsListItem, inputs: ['value', 'textValue'] }],
})
export class ListItemComponent {
  protected readonly item = inject(DsListItem);
}

/** Every list part. */
export const ListParts = [ListComponent, ListItemComponent] as const;
