import {
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { byDocumentOrder, dataFlag, focusElement, openState } from '../utils/dom';
import { uniqueId } from '../utils/id';
import { findNextIndex, findTypeaheadIndex } from '../utils/navigation';
import { createTypeahead } from '../utils/typeahead';

/** `single` (default), `multiple` (Space or click toggles items) or `none` (navigation only). */
export type TreeSelectionMode = 'single' | 'multiple' | 'none';

/**
 * A tree of items. WAI-ARIA APG: Tree View. Up/Down move, Right expands or enters, Left
 * collapses or goes to the parent, Home/End, `*` expands the siblings, type-ahead; single or
 * multiple selection. Name it with `aria-label` or `aria-labelledby`.
 *
 * ```html
 * <ul dsTree aria-label="Files" [(expanded)]="open" [(value)]="selected">
 *   <li dsTreeItem #src="dsTreeItem" value="src" expandable>
 *     <div dsTreeItemRow><span dsTreeItemIndicator>▸</span><span dsTreeItemLabel>src</span></div>
 *     @if (src.open()) {
 *       <ul dsTreeGroup>
 *         <li dsTreeItem value="index.ts">
 *           <div dsTreeItemRow><span dsTreeItemLabel>index.ts</span></div>
 *         </li>
 *       </ul>
 *     }
 *   </li>
 * </ul>
 * ```
 *
 * A `dsTreeGroup` is `hidden` while its item is collapsed; wrap it in `@if (item.open())` to
 * render children only when needed (React renders a group only while open).
 */
@Directive({
  selector: '[dsTree]',
  exportAs: 'dsTree',
  host: {
    role: 'tree',
    '[attr.aria-multiselectable]': 'selectionMode() === "multiple" || null',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class DsTree {
  /** Values of the expanded items. Two-way bindable: `[(expanded)]`. */
  readonly expanded = model<string[]>([]);
  /** `single` (default), `multiple` or `none`. */
  readonly selectionMode = input<TreeSelectionMode>('single');
  /** Values of the selected items. Two-way bindable: `[(value)]`. */
  readonly value = model<string[]>([]);

  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly items = signal<DsTreeItem[]>([]);
  private readonly focusedValue = signal<string | null>(null);
  private readonly typeahead = createTypeahead();

  /**
   * The one item in the tab order: the focused one, else the first selected, else the first.
   * Re-checked when items come and go, in case the focused one went away.
   */
  readonly tabStop = computed(() => {
    const visible = this.visibleItems();
    const focused = this.focusedValue();
    const selected = this.value();
    return (
      visible.find((item) => item.value() === focused) ??
      visible.find((item) => selected.includes(item.value())) ??
      visible[0] ??
      null
    );
  });

  private visibleItems() {
    return this.items()
      .filter((item) => item.visible())
      .sort((a, b) => byDocumentOrder(a.element, b.element));
  }

  register(item: DsTreeItem) {
    this.items.update((items) => [...items, item]);
  }

  unregister(item: DsTreeItem) {
    this.items.update((items) => items.filter((other) => other !== item));
  }

  isExpanded(value: string) {
    return this.expanded().includes(value);
  }

  setExpanded(value: string, open: boolean) {
    const expanded = this.expanded();
    if (open === expanded.includes(value)) return;
    this.expanded.set(open ? [...expanded, value] : expanded.filter((other) => other !== value));
  }

  select(value: string) {
    const mode = this.selectionMode();
    if (mode === 'none') return;
    if (mode === 'single') return this.value.set([value]);
    const selected = this.value();
    this.value.set(
      selected.includes(value) ? selected.filter((other) => other !== value) : [...selected, value],
    );
  }

  /** Makes `item` the tab stop and, with `moveFocus`, focuses it. */
  setFocused(item: DsTreeItem, moveFocus = false) {
    this.focusedValue.set(item.value());
    if (moveFocus) focusElement(item.element);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const element = (event.target as HTMLElement).closest('[role="treeitem"]');
    if (!element || element.closest('[role="tree"]') !== this.element) return;
    const items = this.visibleItems();
    const index = items.findIndex((item) => item.element === element);
    const current = items[index];
    if (!current) return;
    const navigable = items.map((item) => ({ label: item.label(), disabled: false }));
    const focus = (item: DsTreeItem | null | undefined) => item && this.setFocused(item, true);
    const value = current.value();
    const expandable = current.expandable();
    const open = current.open();
    const disabled = current.disabled();

    const steps: Record<string, () => void> = {
      ArrowDown: () => focus(items[findNextIndex(navigable, index, 'next')]),
      ArrowUp: () => focus(items[findNextIndex(navigable, index, 'previous')]),
      Home: () => focus(items[0]),
      End: () => focus(items[items.length - 1]),
      ArrowRight: () => {
        if (expandable && !open) this.setExpanded(value, true);
        else if (open) focus(items.find((item) => item.parent === current));
      },
      ArrowLeft: () => {
        if (open) this.setExpanded(value, false);
        else focus(current.parent);
      },
      Enter: () => {
        if (disabled) return;
        if (this.selectionMode() === 'none' && expandable) this.setExpanded(value, !open);
        else this.select(value);
      },
      ' ': () => !disabled && this.select(value),
      '*': () => {
        // Expand every sibling of the focused item.
        const siblings = items
          .filter((item) => item.parent === current.parent && item.expandable())
          .map((item) => item.value());
        this.expanded.set([...new Set([...this.expanded(), ...siblings])]);
      },
    };
    const step = steps[event.key];
    if (step) {
      event.preventDefault();
      step();
      return;
    }
    const search = this.typeahead(event);
    if (search !== null) {
      event.preventDefault();
      focus(items[findTypeaheadIndex(navigable, index, search)]);
    }
  }
}

/**
 * One item (`role="treeitem"`). Put a `dsTreeItemRow` (with a `dsTreeItemLabel`) inside, and a
 * `dsTreeGroup` of child items when it is `expandable`.
 */
@Directive({
  selector: '[dsTreeItem]',
  exportAs: 'dsTreeItem',
  host: {
    role: 'treeitem',
    '[attr.aria-level]': 'level',
    '[attr.aria-expanded]': 'expandable() ? open() : null',
    '[attr.aria-selected]': 'tree.selectionMode() === "none" ? null : selected()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.aria-labelledby]': 'labelId',
    '[attr.tabindex]': 'tree.tabStop() === this ? 0 : -1',
    '[attr.data-value]': 'value()',
    '[attr.data-state]': 'expandable() ? state() : null',
    '[attr.data-selected]': 'flag(selected())',
    '[attr.data-disabled]': 'flag(disabled())',
    '(focus)': 'onFocus($event)',
  },
})
export class DsTreeItem implements OnInit, OnDestroy {
  protected readonly tree = inject(DsTree);
  private readonly group = inject(DsTreeGroup, { optional: true });
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Identifies the item in `expanded` and `value`. */
  readonly value = input.required<string>();
  /** The item can expand (it has, or will load, child items). */
  readonly expandable = input(false, { transform: booleanAttribute });
  /** The item cannot be selected (it can still be focused). */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** The parent item, for nested items. */
  readonly parent: DsTreeItem | null = this.group?.item ?? null;
  /** Depth, from 1. */
  readonly level: number = (this.parent?.level ?? 0) + 1;
  readonly labelId = uniqueId('ds-tree-label-');
  readonly groupId = uniqueId('ds-tree-group-');

  /** Whether the item is expanded. */
  readonly open = computed(() => this.expandable() && this.tree.isExpanded(this.value()));
  readonly selected = computed(() => this.tree.value().includes(this.value()));
  /** Every ancestor is expanded. */
  readonly visible: () => boolean = computed(
    () => !this.parent || (this.parent.open() && this.parent.visible()),
  );
  protected readonly state = computed(() => openState(this.open()));
  protected readonly flag = dataFlag;

  /** The label element, registered by `dsTreeItemLabel`, for type-ahead. */
  labelElement: HTMLElement | null = null;

  /** The item's text, for type-ahead. */
  label(): string {
    return this.labelElement?.textContent?.trim() ?? '';
  }

  /** Expands or collapses the item. */
  toggle() {
    if (this.expandable()) this.tree.setExpanded(this.value(), !this.open());
  }

  ngOnInit() {
    this.tree.register(this);
  }

  ngOnDestroy() {
    this.tree.unregister(this);
  }

  protected onFocus(event: FocusEvent) {
    // Focus bubbles from nested items; only the item itself counts.
    if (event.target === this.element && this.tree.tabStop() !== this) this.tree.setFocused(this);
  }
}

/**
 * The item's visible row. Clicking it focuses and selects the item (with `selectionMode="none"`
 * it toggles an expandable item instead). It sets `--pada-tree-level` (from 0) for indentation.
 */
@Directive({
  selector: '[dsTreeItemRow]',
  host: {
    '[attr.data-level]': 'item.level',
    '[attr.data-state]': 'item.expandable() ? (item.open() ? "open" : "closed") : null',
    '[attr.data-selected]': 'flag(item.selected())',
    '[attr.data-disabled]': 'flag(item.disabled())',
    '[style.--pada-tree-level]': 'item.level - 1',
    '(click)': 'onClick($event)',
  },
})
export class DsTreeItemRow {
  protected readonly item = inject(DsTreeItem);
  private readonly tree = inject(DsTree);
  protected readonly flag = dataFlag;

  protected onClick(event: Event) {
    if (event.defaultPrevented) return;
    this.tree.setFocused(this.item, true);
    if (this.item.disabled()) return;
    if (this.tree.selectionMode() === 'none' && this.item.expandable()) this.item.toggle();
    else this.tree.select(this.item.value());
  }
}

/** The expand/collapse indicator (a chevron). Clicking it toggles without selecting. */
@Directive({
  selector: '[dsTreeItemIndicator]',
  host: {
    'aria-hidden': 'true',
    '[attr.data-state]': 'item.expandable() ? (item.open() ? "open" : "closed") : null',
    '[attr.data-expandable]': 'flag(item.expandable())',
    '(click)': 'onClick($event)',
  },
})
export class DsTreeItemIndicator {
  protected readonly item = inject(DsTreeItem);
  protected readonly flag = dataFlag;

  protected onClick(event: Event) {
    if (event.defaultPrevented || !this.item.expandable() || this.item.disabled()) return;
    event.stopPropagation();
    this.item.toggle();
  }
}

/** The item's name; labels the tree item. */
@Directive({ selector: '[dsTreeItemLabel]', host: { '[id]': 'item.labelId' } })
export class DsTreeItemLabel implements OnInit, OnDestroy {
  protected readonly item = inject(DsTreeItem);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  ngOnInit() {
    this.item.labelElement = this.element;
  }
  ngOnDestroy() {
    if (this.item.labelElement === this.element) this.item.labelElement = null;
  }
}

/**
 * The child items (`role="group"`), hidden while the item is collapsed. Sets
 * `--pada-tree-level` to its parent's level (from 0), e.g. to draw a guide line.
 */
@Directive({
  selector: '[dsTreeGroup]',
  host: {
    role: 'group',
    '[id]': 'item.groupId',
    '[hidden]': '!item.open()',
    '[style.--pada-tree-level]': 'item.level - 1',
  },
})
export class DsTreeGroup {
  /** The item whose children this group holds. */
  readonly item = inject(DsTreeItem);
}

/** Every tree part, for `imports: [DsTreeParts]`. */
export const DsTreeParts = [
  DsTree,
  DsTreeItem,
  DsTreeItemRow,
  DsTreeItemIndicator,
  DsTreeItemLabel,
  DsTreeGroup,
] as const;
