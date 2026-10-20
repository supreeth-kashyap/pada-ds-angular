import {
  afterNextRender,
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  Injector,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { injectButtonType } from '../utils/button';
import { byDocumentOrder, dataFlag, focusElement } from '../utils/dom';
import { uniqueId } from '../utils/id';

const move = (order: readonly string[], from: number, to: number) => {
  const next = [...order];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

/**
 * A vertical list (`role="list"`) whose items can be reordered: drag an item, or focus its
 * handle, press Space (or Enter) to lift it, move it with the arrow keys (Home/End for the
 * ends) and press Space again to drop it. Escape puts it back. Every step is announced
 * through `dsListAnnouncer`. Items that change place slide there (FLIP).
 *
 * ```html
 * <div dsList draggable aria-label="Tasks" (reorder)="tasks = reorderBy(tasks, $event)">
 *   @for (task of tasks; track task.id) {
 *     <div dsListItem [value]="task.id">
 *       <button dsListDragHandle>⠿</button>
 *       <span dsListItemContent>{{ task.title }}</span>
 *     </div>
 *   }
 * </div>
 * <span dsVisuallyHidden dsListAnnouncer [list]="…"></span>
 * ```
 *
 * Differences from React: the list does not reorder projected content itself. It emits the
 * new order of item `value`s through `(reorder)`; render your items in that order (an `@for`
 * over your array) and the DOM follows. Put `dsListAnnouncer` inside the list's element (or
 * pass it the list with `[list]`).
 */
@Directive({
  selector: '[dsList]',
  exportAs: 'dsList',
  host: { role: 'list', '[attr.data-draggable]': 'flag(draggable())' },
})
export class DsList {
  /** Lets users reorder items, by drag and drop or with the keyboard on each item's handle. */
  readonly draggable = input(false, { transform: booleanAttribute });
  /** The item values in their new order, after every move (and after a cancelled lift). */
  readonly reorder = output<string[]>();

  /** The item lifted with the keyboard, if any. */
  readonly lifted = signal<{ value: string; origin: readonly string[] } | null>(null);
  /** The latest announcement for the live region. */
  readonly announcement = signal('');

  private readonly items = signal<readonly DsListItem[]>([]);
  private readonly injector = inject(Injector);
  protected readonly flag = dataFlag;

  register(item: DsListItem) {
    this.items.update((items) => [...items, item]);
  }
  unregister(item: DsListItem) {
    this.items.update((items) => items.filter((entry) => entry !== item));
  }

  /** Items in document order. */
  orderedItems() {
    return [...this.items()].sort((a, b) => byDocumentOrder(a.element, b.element));
  }

  /** Item values in document order. */
  order(): string[] {
    return this.orderedItems().map((item) => item.value());
  }

  private position(value: string, order: readonly string[] = this.order()) {
    return `position ${order.indexOf(value) + 1} of ${order.length}`;
  }

  /** Emits a new order, then slides the items that moved from where they were. */
  commit(next: readonly string[]) {
    const items = this.orderedItems();
    const before = new Map(items.map((item) => [item, item.element.offsetTop]));
    const active = items[0]?.element.ownerDocument.activeElement;
    const focused = items.some((item) => item.handle() === active) ? (active as HTMLElement) : null;
    this.reorder.emit([...next]);
    afterNextRender(
      {
        write: () => {
          for (const [item, previous] of before) {
            const element = item.element;
            const top = element.offsetTop;
            if (!element.isConnected || previous === top) continue;
            element.style.transition = 'none';
            element.style.translate = `0 ${previous - top}px`;
            void element.offsetHeight;
            element.style.transition = '';
            element.style.translate = '';
          }
          // Re-inserting an item can drop focus; keep it on the handle that had it.
          if (focused?.isConnected && focused.ownerDocument.activeElement !== focused)
            focusElement(focused);
        },
      },
      { injector: this.injector },
    );
  }

  /** Mouse drag and drop: moves `source` to where `target` is. */
  moveTo(source: string, target: string) {
    const order = this.order();
    const from = order.indexOf(source);
    const to = order.indexOf(target);
    if (from === -1 || to === -1 || from === to) return;
    this.commit(move(order, from, to));
  }

  /** Keyboard reordering on an item's handle. Returns whether the key was handled. */
  handleKey(item: DsListItem, event: KeyboardEvent): boolean {
    const value = item.value();
    const label = item.label();
    const order = this.order();
    const lifted = this.lifted();
    if (event.key === ' ' || event.key === 'Enter') {
      if (lifted?.value === value) {
        this.lifted.set(null);
        this.announcement.set(`${label} dropped at ${this.position(value, order)}.`);
      } else {
        this.lifted.set({ value, origin: order });
        this.announcement.set(
          `${label} lifted, ${this.position(value, order)}. Use the arrow keys to move it, Space to drop it, Escape to cancel.`,
        );
      }
      return true;
    }
    if (lifted?.value !== value) return false;
    if (event.key === 'Escape') {
      this.lifted.set(null);
      this.commit(lifted.origin);
      this.announcement.set(
        `Reordering cancelled. ${label} returned to ${this.position(value, lifted.origin)}.`,
      );
      return true;
    }
    const index = order.indexOf(value);
    const target = (
      { ArrowUp: index - 1, ArrowDown: index + 1, Home: 0, End: order.length - 1 } as Record<
        string,
        number
      >
    )[event.key];
    if (target === undefined) return false;
    if (target < 0 || target >= order.length || target === index) return true;
    const next = move(order, index, target);
    this.commit(next);
    this.announcement.set(`${label} moved to ${this.position(value, next)}.`);
    return true;
  }

  /** Focus left a lifted item's handle for good: the lift ends where the item is. */
  endLift(item: DsListItem) {
    if (this.lifted()?.value === item.value()) this.lifted.set(null);
  }
}

/**
 * One row: `role="listitem"`, `data-lifted` while lifted with the keyboard, and a drag source
 * and drop target in a draggable list.
 */
@Directive({
  selector: '[dsListItem]',
  exportAs: 'dsListItem',
  host: {
    role: 'listitem',
    '[attr.data-list-item]': 'value()',
    '[attr.data-lifted]': 'flag(isLifted())',
    '[attr.draggable]': 'list.draggable() ? "true" : null',
    '(dragstart)': 'onDragStart($event)',
    '(dragover)': 'onDragOver($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class DsListItem implements OnInit, OnDestroy {
  readonly list = inject(DsList);
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Identifies the item in the order `reorder` emits. */
  readonly value = input.required<string>();
  /** Name used in the handle's label and the announcements. Defaults to the content's text. */
  readonly textValue = input<string>();

  readonly isLifted = computed(() => this.list.lifted()?.value === this.value());
  readonly handle = signal<HTMLElement | null>(null);
  readonly content = signal<HTMLElement | null>(null);
  /** Id of the content part, which names the handle. */
  readonly contentId = signal<string | null>(null);
  protected readonly flag = dataFlag;

  label(): string {
    const text = this.textValue() ?? (this.content() ?? this.element).textContent?.trim();
    return text || 'Item';
  }

  ngOnInit() {
    this.list.register(this);
  }
  ngOnDestroy() {
    this.list.unregister(this);
  }

  protected onDragStart(event: DragEvent) {
    if (!this.list.draggable() || !event.dataTransfer) return;
    event.dataTransfer.setData('text/plain', this.value());
    event.dataTransfer.effectAllowed = 'move';
  }
  protected onDragOver(event: DragEvent) {
    if (this.list.draggable()) event.preventDefault();
  }
  protected onDrop(event: DragEvent) {
    if (!this.list.draggable() || !event.dataTransfer) return;
    event.preventDefault();
    this.list.moveTo(event.dataTransfer.getData('text/plain'), this.value());
  }
}

/** The item's main content; names the drag handle ("Move" plus this text). */
@Directive({ selector: '[dsListItemContent]', host: { '[id]': 'id' } })
export class DsListItemContent implements OnInit, OnDestroy {
  private readonly item = inject(DsListItem);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly id = uniqueId('ds-list-item-');
  ngOnInit() {
    this.item.content.set(this.element);
    this.item.contentId.set(this.id);
  }
  ngOnDestroy() {
    if (this.item.content() !== this.element) return;
    this.item.content.set(null);
    this.item.contentId.set(null);
  }
}

/**
 * The handle that lifts, moves and drops its item with the keyboard: a toggle button
 * (`aria-pressed` while lifted) named "Move" plus the item's content.
 */
@Directive({
  selector: '[dsListDragHandle]',
  host: {
    'aria-label': 'Move',
    '[id]': 'id',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-pressed]': 'item.isLifted()',
    '(keydown)': 'onKeyDown($event)',
    '(blur)': 'onBlur()',
  },
})
export class DsListDragHandle implements OnInit, OnDestroy {
  protected readonly item = inject(DsListItem);
  private readonly element = injectButtonType();
  protected readonly id = uniqueId('ds-list-handle-');
  protected readonly labelledBy = computed(() => {
    const content = this.item.contentId();
    return content ? `${this.id} ${content}` : null;
  });

  ngOnInit() {
    this.item.handle.set(this.element);
  }
  ngOnDestroy() {
    if (this.item.handle() === this.element) this.item.handle.set(null);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    if (this.item.list.handleKey(this.item, event)) {
      event.preventDefault();
      // Escape ends the lift here; it must not also close a dialog around the list.
      if (event.key === 'Escape') event.stopPropagation();
    }
  }

  protected onBlur() {
    // A move re-inserts the item, which can blur the handle; only a real focus change ends
    // the lift. Checked once the move has settled.
    const doc = this.element.ownerDocument;
    (doc.defaultView ?? window).setTimeout(() => {
      if (doc.activeElement !== this.element && this.element.isConnected)
        this.item.list.endLift(this.item);
    }, 0);
  }
}

/**
 * The live region that announces lifts, moves and drops. Hide it visually
 * (`dsVisuallyHidden`). Inside the list's element it finds the list; elsewhere pass it with
 * `[list]`.
 */
@Directive({
  selector: '[dsListAnnouncer]',
  host: {
    'aria-live': 'assertive',
    'aria-atomic': 'true',
    '[textContent]': 'source()?.announcement() ?? ""',
  },
})
export class DsListAnnouncer {
  private readonly ancestor = inject(DsList, { optional: true });
  /** The list to announce for, when this element is not inside it. */
  readonly list = input<DsList>();
  protected readonly source = computed(() => this.list() ?? this.ancestor);
}

/** Every list part, for `imports: [...DsListParts]`. */
export const DsListParts = [
  DsList,
  DsListItem,
  DsListItemContent,
  DsListDragHandle,
  DsListAnnouncer,
] as const;
