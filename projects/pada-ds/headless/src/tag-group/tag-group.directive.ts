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
import { findNextIndex, keyToNavigation } from '../utils/navigation';

/**
 * A list of tags with one tab stop: the tags' focusable parts (their remove buttons, marked
 * `dsTagGroupItem`) share a roving `tabindex`, arrow keys move between them (Left/Right and
 * Up/Down, since tags wrap onto several lines), and Home/End jump to the ends. When a tag is
 * removed from the keyboard or by its button, focus moves to the next tag, else the previous
 * one, else the group itself. `role="list"`; name it with `aria-label`, and give each tag
 * `role="listitem"`.
 *
 * ```html
 * <div dsTagGroup aria-label="Filters">
 *   @for (filter of filters(); track filter) {
 *     <span role="listitem">
 *       {{ filter }}
 *       <button dsTagGroupItem aria-label="Remove {{ filter }}" (remove)="drop(filter)">×</button>
 *     </span>
 *   }
 * </div>
 * ```
 *
 * React has no TagGroup yet: it is designed from the roadmap entry (Tags becomes "Tag
 * (removable) + TagGroup").
 */
@Directive({
  selector: '[dsTagGroup]',
  exportAs: 'dsTagGroup',
  host: {
    role: 'list',
    // Lets focus land on the group when its last tag is removed.
    tabindex: '-1',
    '[attr.data-disabled]': 'flag(disabled())',
    '[attr.dir]': 'dir() ?? null',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class DsTagGroup {
  /** Wrap focus from the last tag to the first and back. @default true */
  readonly loop = input(true, { transform: booleanAttribute });
  /** Disables every tag's remove button. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Reading direction for the arrow keys. Set on the element as `dir` when given. */
  readonly dir = input<'ltr' | 'rtl'>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  protected readonly flag = dataFlag;
  private readonly items = signal<readonly DsTagGroupItem[]>([]);
  private readonly focused = signal<DsTagGroupItem | null>(null);
  /** The tag being removed, and where it was, so focus can move on once it is gone. */
  private removing: { item: DsTagGroupItem; index: number } | null = null;

  /** The registered items, in DOM order. */
  readonly ordered = computed(() =>
    [...this.items()].sort((a, b) => byDocumentOrder(a.element, b.element)),
  );
  /** The item in the tab order: the last focused, else the first enabled one. */
  readonly tabStop = computed(() => {
    const enabled = this.ordered().filter((item) => !item.isDisabled());
    const focused = this.focused();
    return focused && enabled.includes(focused) ? focused : (enabled[0] ?? null);
  });

  register(item: DsTagGroupItem) {
    this.items.update((items) => [...items, item]);
  }
  unregister(item: DsTagGroupItem) {
    this.items.update((items) => items.filter((entry) => entry !== item));
    if (this.focused() === item) this.focused.set(null);
    if (this.removing?.item !== item) return;
    const { index } = this.removing;
    this.removing = null;
    afterNextRender(
      () => {
        if (!this.element.isConnected) return;
        const enabled = this.ordered().filter((entry) => !entry.isDisabled());
        const next = enabled[Math.min(index, enabled.length - 1)];
        if (next) this.focusItem(next);
        else focusElement(this.element);
      },
      { injector: this.injector },
    );
  }
  /** Makes the item the tab stop (it received focus). */
  setFocused(item: DsTagGroupItem) {
    this.focused.set(item);
    // A removal the consumer declined no longer decides where focus goes.
    if (this.removing && this.removing.item !== item) this.removing = null;
  }
  /** Notes that `item` asked to be removed, so focus can follow once it unregisters. */
  willRemove(item: DsTagGroupItem) {
    const enabled = this.ordered().filter((entry) => !entry.isDisabled());
    const index = enabled.indexOf(item);
    if (index !== -1) this.removing = { item, index };
  }

  private focusItem(item: DsTagGroupItem) {
    this.focused.set(item);
    focusElement(item.element);
  }

  protected handleKeydown(event: KeyboardEvent) {
    const step = keyToNavigation(event.key, 'both', this.dir() ?? 'ltr');
    if (!step) return;
    const items = this.ordered();
    const from = items.findIndex((item) => item.element === event.target);
    if (from === -1) return;
    const descriptors = items.map((item) => ({
      label: item.element.textContent ?? '',
      disabled: item.isDisabled(),
    }));
    const next = findNextIndex(descriptors, from, step, { loop: this.loop() });
    if (next === -1) return;
    event.preventDefault();
    this.focusItem(items[next]);
  }
}

/**
 * The focusable part of a tag, normally its remove button. Emits `remove` on click and on
 * Delete or Backspace. Inside a `dsTagGroup` it joins the group's roving focus; on its own it
 * is a plain button.
 */
@Directive({
  selector: '[dsTagGroupItem]',
  exportAs: 'dsTagGroupItem',
  host: {
    '[attr.tabindex]': 'tabIndex()',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.data-disabled]': 'flag(isDisabled())',
    '(click)': 'handleClick($event)',
    '(keydown)': 'handleKeydown($event)',
    '(focus)': 'group?.setFocused(this)',
  },
})
export class DsTagGroupItem implements OnInit, OnDestroy {
  protected readonly group = inject(DsTagGroup, { optional: true });
  /** @internal */
  readonly element = injectButtonType();
  /** Disables this item. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Asks for the tag to be removed (click, Delete or Backspace). The consumer removes it. */
  readonly remove = output<void>();

  /** Disabled itself or through the group. */
  readonly isDisabled = computed(() => this.disabled() || (this.group?.disabled() ?? false));
  protected readonly tabIndex = computed(() => {
    if (!this.group) return null;
    return this.group.tabStop() === this ? 0 : -1;
  });
  protected readonly flag = dataFlag;

  ngOnInit() {
    this.group?.register(this);
  }
  ngOnDestroy() {
    this.group?.unregister(this);
  }

  protected handleClick(event: Event) {
    if (event.defaultPrevented || this.isDisabled()) return;
    this.requestRemove();
  }
  protected handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    if (this.isDisabled()) return;
    event.preventDefault();
    this.requestRemove();
  }
  private requestRemove() {
    this.group?.willRemove(this);
    this.remove.emit();
  }
}

/** The tag group parts, for `imports: [DsTagGroupParts]`. */
export const DsTagGroupParts = [DsTagGroup, DsTagGroupItem] as const;
