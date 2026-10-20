import {
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  numberAttribute,
  OnDestroy,
  OnInit,
  output,
  Signal,
  signal,
  untracked,
} from '@angular/core';
import { injectButtonType } from '../utils/button';
import { DismissEvent } from '../utils/dismissable';
import { byDocumentOrder, checkedState, dataFlag, focusElement, openState } from '../utils/dom';
import { createFloating, FloatingAnchor, type Align, type Side } from '../utils/floating';
import { DsFloating, DsFloatingContext, injectFloatingLayer } from '../utils/floating.directive';
import { AutoFocusEvent } from '../utils/focus-scope';
import { uniqueId } from '../utils/id';
import { findNextIndex, findTypeaheadIndex, keyToNavigation } from '../utils/navigation';
import { createTypeahead } from '../utils/typeahead';
import { MenuPointerGrace } from './pointer-grace';

/** What receives focus when a menu's content mounts: set by how the menu was opened. */
export type MenuFocusTarget = 'first' | 'last' | 'content';
export type MenuDirection = 'ltr' | 'rtl';

/** An item registered with its menu, for arrow keys, Home/End and type-ahead. */
export interface MenuItemRef {
  element: HTMLElement;
  disabled: () => boolean;
  label: () => string;
}

/** Event passed to an item's `select` output. Call `preventDefault()` to keep the menu open. */
export interface MenuSelectEvent {
  defaultPrevented: boolean;
  preventDefault(): void;
}

const createSelectEvent = (): MenuSelectEvent => {
  const event: MenuSelectEvent = {
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true;
    },
  };
  return event;
};

/**
 * The state of one menu, shared by its trigger, content and items. Provided by every menu root:
 * `dsDropdownMenu`, `dsDropdownMenuSub`, `dsContextMenu` and `dsMenubarMenu`. Items register
 * here (with the root, an ancestor in the consumer's template), never with the content part.
 */
export abstract class DsMenuContext {
  abstract readonly open: Signal<boolean>;
  abstract readonly dir: Signal<MenuDirection>;
  /** True for submenus: they open to the side and close with ArrowLeft (ArrowRight in RTL). */
  abstract readonly isSub: boolean;
  abstract setOpen(open: boolean): void;
  /** Closes this menu and every menu it is nested in (an item was chosen). */
  abstract closeAll(): void;
  /** Menubar menus: opens the menu after (1) or before (-1) this one in the bar. */
  openAdjacent?(step: 1 | -1): void;

  /** The menu this submenu is nested in; null for a root menu. */
  readonly parent: DsMenuContext | null = null;
  readonly contentId = uniqueId('ds-menu-');
  readonly triggerId = `${this.contentId}-trigger`;
  readonly trigger = signal<HTMLElement | null>(null);
  readonly content = signal<HTMLElement | null>(null);
  /** Context menus open at a point instead of at their trigger. */
  readonly anchor: Signal<FloatingAnchor | null> = signal(null);
  focusOnOpen: MenuFocusTarget = 'content';
  readonly pointerGrace = new MenuPointerGrace();

  private readonly registered = signal<readonly MenuItemRef[]>([]);
  readonly items = this.registered.asReadonly();

  register(item: MenuItemRef) {
    this.registered.update((items) => [...items, item]);
  }
  unregister(item: MenuItemRef) {
    this.registered.update((items) => items.filter((entry) => entry !== item));
  }
  /** Items rendered in the open content, in DOM order. */
  renderedItems(): MenuItemRef[] {
    const content = this.content();
    if (!content) return [];
    return this.items()
      .filter((item) => content.contains(item.element))
      .sort((a, b) => byDocumentOrder(a.element, b.element));
  }
  /** Opens the menu, choosing what receives focus when the content mounts. */
  openWith(target: MenuFocusTarget) {
    this.focusOnOpen = target;
    this.setOpen(true);
  }
}

const menuProviders = (type: unknown) => [
  { provide: DsMenuContext, useExisting: type },
  DsFloatingContext,
];

// ── Root ───────────────────────────────────────────────────────────────────────────────────

/**
 * Holds the state for a menu button. Renders nothing; put it on an `<ng-container>` or any
 * wrapper. WAI-ARIA APG: Menu Button.
 *
 * ```html
 * <ng-container dsDropdownMenu #actions="dsDropdownMenu">
 *   <button dsDropdownMenuTrigger>Actions</button>
 *   <div *dsPresence="actions.open()" dsDropdownMenuContent>
 *     <div dsDropdownMenuItem (select)="rename()">Rename</div>
 *     <div dsDropdownMenuCheckboxItem [(checked)]="pinned">
 *       <span dsDropdownMenuItemIndicator>✓</span> Pinned
 *     </div>
 *     <div dsDropdownMenuSeparator></div>
 *     <ng-container dsDropdownMenuSub #move="dsDropdownMenuSub">
 *       <div dsDropdownMenuSubTrigger>Move to</div>
 *       <div *dsPresence="move.open()" dsDropdownMenuSubContent>…</div>
 *     </ng-container>
 *   </div>
 * </ng-container>
 * ```
 *
 * Differences from React: there is no Portal part (the content stays in place in the DOM and
 * joins the top layer), and `asChild` is unnecessary (put the directives on your own elements).
 */
@Directive({
  selector: '[dsDropdownMenu]',
  exportAs: 'dsDropdownMenu',
  providers: menuProviders(DsDropdownMenu),
})
export class DsDropdownMenu extends DsMenuContext {
  /** Whether the menu is open. Two-way bindable: `[(open)]`. */
  readonly open = model(false);
  /** Reading direction, for arrow keys and submenu placement. @default 'ltr' */
  readonly dir = input<MenuDirection>('ltr');
  readonly isSub = false;

  setOpen(open: boolean) {
    this.open.set(open);
  }
  closeAll() {
    this.setOpen(false);
  }
}

/**
 * Opens the menu: on click (focus goes to the menu), or with Enter, Space or ArrowDown (first
 * item) and ArrowUp (last item). Gets `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`
 * and `data-state`.
 */
@Directive({
  selector: '[dsDropdownMenuTrigger]',
  host: {
    'aria-haspopup': 'menu',
    '[id]': 'menu.triggerId',
    '[attr.aria-expanded]': 'menu.open()',
    '[attr.aria-controls]': 'menu.open() ? menu.contentId : null',
    '[attr.data-state]': 'state()',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class DsDropdownMenuTrigger implements OnInit, OnDestroy {
  protected readonly menu = inject(DsMenuContext);
  private readonly element = injectButtonType();
  protected readonly state = computed(() => openState(this.menu.open()));

  ngOnInit() {
    this.menu.trigger.set(this.element);
  }
  ngOnDestroy() {
    if (this.menu.trigger() === this.element) this.menu.trigger.set(null);
  }
  protected onClick(event: MouseEvent) {
    // detail is 0 for clicks synthesised from Enter/Space, which onKeyDown already handled.
    if (event.detail === 0) return;
    if (this.menu.open()) this.menu.setOpen(false);
    else this.menu.openWith('content');
  }
  protected onKeyDown(event: KeyboardEvent) {
    if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      this.menu.openWith('first');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.menu.openWith('last');
    }
  }
}

// ── Content ────────────────────────────────────────────────────────────────────────────────

const optionalNumber = (value: unknown): number | undefined =>
  value == null || value === '' ? undefined : numberAttribute(value);

/**
 * The menu: `role="menu"`, in the top layer, positioned against its trigger (or the pointer, for
 * context menus), with arrow keys, Home/End and type-ahead over its items. Tab closes every
 * menu; in a submenu, ArrowLeft (ArrowRight in RTL) closes it. Render it with
 * `*dsPresence="menu.open()"` so it can animate out. `dsDropdownMenuSubContent` is the same
 * part for a submenu.
 *
 * Defaults follow React: root menus open below their trigger aligned to the start, submenus to
 * the side, context menus at the pointer.
 */
@Directive({
  selector: '[dsDropdownMenuContent], [dsDropdownMenuSubContent]',
  exportAs: 'dsDropdownMenuContent',
  hostDirectives: [DsFloating],
  host: {
    role: 'menu',
    'aria-orientation': 'vertical',
    tabindex: '-1',
    'data-pada-layer': '',
    '[id]': 'menu.contentId',
    '[attr.aria-labelledby]': 'menu.anchor() ? null : menu.triggerId',
    '[attr.data-state]': 'state()',
    '(keydown)': 'onKeyDown($event)',
    '(pointermove)': 'onPointerMove($event)',
  },
})
export class DsDropdownMenuContent {
  protected readonly menu = inject(DsMenuContext);
  private readonly floating = inject(DsFloating);
  private readonly element = this.floating.element;
  protected readonly state = computed(() => openState(this.menu.open()));

  /** Preferred side. @default 'bottom'; submenus 'right' ('left' in RTL) */
  readonly side = input<Side>();
  /** Alignment along the side. @default 'start' */
  readonly align = input<Align>('start');
  /** Gap from the trigger, in px. @default 4; submenus 0; context menus 2 */
  readonly sideOffset = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /** Shift along the alignment axis, in px. @default 0; submenus -4 (lines up the first item) */
  readonly alignOffset = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /** Flip and shift to stay in the viewport. @default true */
  readonly avoidCollisions = input(true, { transform: booleanAttribute });
  /** Distance to keep from the viewport edges, in px. @default 8 */
  readonly collisionPadding = input(8, { transform: numberAttribute });
  /** Hide the menu when its trigger scrolls out of view. */
  readonly hideWhenDetached = input(false, { transform: booleanAttribute });
  /** Wrap focus from the last item to the first and back. @default true */
  readonly loop = input(true, { transform: booleanAttribute });

  /** Focus is about to return to the trigger. Prevent it to focus something else yourself. */
  readonly closeAutoFocus = output<AutoFocusEvent>();
  /** Escape was pressed. Prevent it to keep the menu open. */
  readonly escapeKeyDown = output<DismissEvent<KeyboardEvent>>();
  /** A pointer went down outside. Prevent it to keep the menu open. */
  readonly pointerDownOutside = output<DismissEvent<PointerEvent>>();
  /** Focus moved outside. Prevent it to keep the menu open. */
  readonly focusOutside = output<DismissEvent<FocusEvent>>();
  /** Any interaction outside. Prevent it to keep the menu open. */
  readonly interactOutside = output<DismissEvent<PointerEvent | FocusEvent>>();

  private readonly typeahead = createTypeahead();
  private restoreFocus = false;

  private readonly placement = computed(() => {
    const menu = this.menu;
    const sideways = menu.dir() === 'rtl' ? 'left' : 'right';
    return {
      side: this.side() ?? (menu.isSub ? sideways : 'bottom'),
      align: this.align(),
      sideOffset: this.sideOffset() ?? (menu.isSub ? 0 : menu.anchor() ? 2 : 4),
      alignOffset: this.alignOffset() ?? (menu.isSub ? -4 : 0),
      avoidCollisions: this.avoidCollisions(),
      collisionPadding: this.collisionPadding(),
      hideWhenDetached: this.hideWhenDetached(),
    };
  });

  constructor() {
    const menu = this.menu;
    const element = this.element;
    const doc = element.ownerDocument;
    // Context menus return focus to whatever had it; the others to their trigger.
    const previous = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    menu.content.set(element);

    // Positioning is done below (menu defaults differ from DsFloating's), so no anchor here.
    const { mounted } = injectFloatingLayer({
      open: menu.open,
      anchor: () => null,
      dismiss: () => ({
        onDismiss: () => menu.setOpen(false),
        onEscapeKeyDown: (event) => {
          this.escapeKeyDown.emit(event);
          // A closed submenu stays the top layer until change detection removes its listener;
          // an Escape in that gap (pressed twice quickly) is meant for the parent.
          if (!event.defaultPrevented && !menu.open() && menu.parent) menu.parent.setOpen(false);
        },
        onPointerDownOutside: (event) => this.pointerDownOutside.emit(event),
        onFocusOutside: (event) => this.focusOutside.emit(event),
        dismissOnFocusOutside: true,
        onInteractOutside: (event) => {
          this.interactOutside.emit(event);
          const trigger = menu.trigger();
          if (event.target instanceof Node && trigger?.contains(event.target))
            event.preventDefault();
        },
      }),
      focus: () => ({
        trapped: false,
        onMountAutoFocus: (event) => {
          event.preventDefault();
          const items = menu.renderedItems().filter((item) => !item.disabled());
          const target =
            menu.focusOnOpen === 'first'
              ? items[0]
              : menu.focusOnOpen === 'last'
                ? items[items.length - 1]
                : undefined;
          focusElement(target?.element ?? element);
          menu.focusOnOpen = 'content';
        },
        onUnmountAutoFocus: (event) => {
          this.closeAutoFocus.emit(event);
          // Returned below to the trigger rather than to whatever was focused on open (an item
          // of the previous menu, when a menubar switched menus).
          if (!event.defaultPrevented) {
            event.preventDefault();
            this.restoreFocus = true;
          }
        },
      }),
    });

    effect((onCleanup) => {
      const anchor = menu.anchor() ?? menu.trigger();
      if (!mounted() || !anchor) return;
      const stop = untracked(() =>
        createFloating(
          anchor,
          element,
          () => this.placement(),
          ({ side, align }) => {
            this.floating.placedSide.set(side);
            this.floating.placedAlign.set(align);
          },
        ),
      );
      onCleanup(stop);
    });

    inject(DestroyRef).onDestroy(() => {
      if (menu.content() === element) menu.content.set(null);
      if (!this.restoreFocus) return;
      const target = menu.anchor() ? previous : menu.trigger();
      const win = doc.defaultView ?? window;
      // Once the content has left the DOM; only focus that was lost with it returns.
      win.setTimeout(() => {
        const current = doc.activeElement;
        const lost = !current || current === doc.body || !current.isConnected;
        if (lost && target?.isConnected) focusElement(target);
      }, 0);
    });
  }

  protected onKeyDown(event: KeyboardEvent) {
    // Items and submenus handle their keys first and prevent them.
    if (event.defaultPrevented) return;
    const menu = this.menu;
    const target = event.target as HTMLElement;
    const inThisMenu = target.closest?.('[role="menu"]') === this.element;
    const rtl = menu.dir() === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';

    if (inThisMenu && menu.isSub && event.key === back) {
      event.preventDefault();
      menu.setOpen(false);
      return;
    }
    // Menubar menus: Right opens the next menu (also from inside a submenu, unless it opened
    // one); Left the previous one (a submenu closed itself above).
    if (menu.openAdjacent && (event.key === forward || (event.key === back && inThisMenu))) {
      event.preventDefault();
      menu.openAdjacent(event.key === forward ? 1 : -1);
      return;
    }
    if (!inThisMenu) return;
    if (event.key === 'Tab') {
      event.preventDefault();
      menu.closeAll();
      return;
    }
    const items = menu.renderedItems();
    const descriptors = items.map((item) => ({ label: item.label(), disabled: item.disabled() }));
    const current = items.findIndex((item) => item.element === target);
    const step = keyToNavigation(event.key, 'vertical', menu.dir());
    if (step) {
      event.preventDefault();
      const next = findNextIndex(descriptors, current, step, { loop: this.loop() });
      if (next !== -1) focusElement(items[next].element);
      return;
    }
    const search = this.typeahead(event);
    if (search !== null) {
      const next = findTypeaheadIndex(descriptors, current, search);
      if (next !== -1 && next !== current) focusElement(items[next].element);
    }
  }

  protected onPointerMove(event: PointerEvent) {
    // Moving the pointer off the items (onto padding or a label) clears the highlight.
    const element = this.element;
    if (event.target !== element || element.ownerDocument.activeElement === element) return;
    if (this.menu.pointerGrace.blocks(event, null)) return;
    focusElement(element);
  }
}

// ── Items ──────────────────────────────────────────────────────────────────────────────────

/** Shared item behaviour: highlight on focus and hover, choose with click, Enter or Space. */
@Directive({
  host: {
    tabindex: '-1',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.data-disabled]': 'disabledFlag()',
    '[attr.data-highlighted]': 'highlightedFlag()',
    '(click)': 'choose()',
    '(keydown)': 'onKeyDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerleave)': 'onPointerLeave($event)',
    '(focus)': 'highlighted.set(true)',
    '(blur)': 'highlighted.set(false)',
  },
})
export abstract class DsMenuItemBase implements OnInit, OnDestroy {
  /** Skipped by the arrow keys and cannot be chosen. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Text for type-ahead, when the item's text content is not right (icons, shortcuts). */
  readonly textValue = input<string>();
  /**
   * The item was chosen (click, Enter or Space). Call `preventDefault()` on the event to keep
   * the menu open.
   */
  // Named after React's onSelect. The native `select` event only fires on text fields.
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly select = output<MenuSelectEvent>();

  protected readonly menu = inject(DsMenuContext);
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly highlighted = signal(false);
  protected readonly disabledFlag = computed(() => dataFlag(this.disabled()));
  protected readonly highlightedFlag = computed(() => dataFlag(this.highlighted()));
  /** Whether choosing the item closes the menus. */
  protected readonly closeOnSelect: boolean = true;

  private readonly ref: MenuItemRef = {
    element: this.element,
    disabled: () => this.disabled(),
    label: () => this.textValue() ?? this.element.textContent ?? '',
  };

  /** The menu whose keyboard navigation includes this item. */
  protected get owner(): DsMenuContext {
    return this.menu;
  }

  ngOnInit() {
    this.owner.register(this.ref);
  }
  ngOnDestroy() {
    this.owner.unregister(this.ref);
  }

  protected choose() {
    if (this.disabled()) return;
    const event = createSelectEvent();
    this.select.emit(event);
    this.onChosen();
    if (this.closeOnSelect && !event.defaultPrevented) this.menu.closeAll();
  }

  /** Runs after `select` was emitted, whether or not it was prevented. */
  protected onChosen() {
    // Checkbox and radio items update their state here.
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.choose();
    }
  }

  protected onPointerMove(event: PointerEvent) {
    if (this.disabled() || event.pointerType === 'touch') return;
    if (this.owner.pointerGrace.blocks(event, this.element)) return;
    if (this.element.ownerDocument.activeElement !== this.element) focusElement(this.element);
  }

  protected onPointerLeave(event: PointerEvent) {
    // Clear the highlight when the pointer moves to another part of the same menu. Moving into
    // a submenu's content (or off the menu entirely) keeps it, so the submenu stays open.
    const menu = this.owner.content();
    const related = event.relatedTarget;
    if (
      this.element.ownerDocument.activeElement === this.element &&
      related instanceof Node &&
      menu?.contains(related) &&
      !this.owner.pointerGrace.blocks(event, null)
    ) {
      focusElement(menu);
    }
  }
}

/** An action: `role="menuitem"`. Chosen with click, Enter or Space; closes the menus unless `select` is prevented. */
@Directive({
  selector: '[dsDropdownMenuItem]',
  exportAs: 'dsDropdownMenuItem',
  host: { role: 'menuitem' },
})
export class DsDropdownMenuItem extends DsMenuItemBase {}

/** The checked state of a checkbox or radio item, for `dsDropdownMenuItemIndicator`. */
export abstract class DsMenuCheckable {
  abstract readonly checkedState: Signal<boolean | 'indeterminate'>;
}

/** A toggle: `role="menuitemcheckbox"` with `aria-checked`. Closes the menus unless `select` is prevented. */
@Directive({
  selector: '[dsDropdownMenuCheckboxItem]',
  exportAs: 'dsDropdownMenuCheckboxItem',
  providers: [{ provide: DsMenuCheckable, useExisting: DsDropdownMenuCheckboxItem }],
  host: {
    role: 'menuitemcheckbox',
    '[attr.aria-checked]': 'ariaChecked()',
    '[attr.data-state]': 'state()',
  },
})
export class DsDropdownMenuCheckboxItem extends DsMenuItemBase implements DsMenuCheckable {
  /** Checked state; `'indeterminate'` for mixed. Two-way bindable: `[(checked)]`. */
  readonly checked = model<boolean | 'indeterminate'>(false);
  readonly checkedState = this.checked.asReadonly();
  protected readonly ariaChecked = computed(() =>
    this.checked() === 'indeterminate' ? 'mixed' : String(this.checked()),
  );
  protected readonly state = computed(() => checkedState(this.checked()));

  protected override onChosen() {
    const checked = this.checked();
    this.checked.set(checked === 'indeterminate' ? true : !checked);
  }
}

/** Groups radio items: `role="group"`; exactly one is checked. Name it with `aria-label`. */
@Directive({
  selector: '[dsDropdownMenuRadioGroup]',
  exportAs: 'dsDropdownMenuRadioGroup',
  host: { role: 'group' },
})
export class DsDropdownMenuRadioGroup {
  /** The checked item's value. Two-way bindable: `[(value)]`. */
  readonly value = model<string>();
}

/** One option in a radio group: `role="menuitemradio"` with `aria-checked`. */
@Directive({
  selector: '[dsDropdownMenuRadioItem]',
  exportAs: 'dsDropdownMenuRadioItem',
  providers: [{ provide: DsMenuCheckable, useExisting: DsDropdownMenuRadioItem }],
  host: {
    role: 'menuitemradio',
    '[attr.aria-checked]': 'checkedState()',
    '[attr.data-state]': 'state()',
  },
})
export class DsDropdownMenuRadioItem extends DsMenuItemBase implements DsMenuCheckable {
  /** This item's value in its radio group. */
  readonly value = input.required<string>();
  private readonly group = inject(DsDropdownMenuRadioGroup);
  readonly checkedState = computed(() => this.group.value() === this.value());
  protected readonly state = computed(() => checkedState(this.checkedState()));

  protected override onChosen() {
    this.group.value.set(this.value());
  }
}

/**
 * Shown only while the surrounding checkbox or radio item is checked (`hidden` otherwise), with
 * `data-state` for animation. Decorative: `aria-hidden`.
 */
@Directive({
  selector: '[dsDropdownMenuItemIndicator]',
  host: {
    'aria-hidden': 'true',
    '[attr.data-state]': 'state()',
    '[attr.hidden]': 'checkable.checkedState() || forceMount() ? null : ""',
  },
})
export class DsDropdownMenuItemIndicator {
  protected readonly checkable = inject(DsMenuCheckable);
  /** Keep it shown while unchecked (to animate it). */
  readonly forceMount = input(false, { transform: booleanAttribute });
  protected readonly state = computed(() => checkedState(this.checkable.checkedState()));
}

/** A non-focusable heading for a group of items. Point a group's `aria-labelledby` at it. */
@Directive({ selector: '[dsDropdownMenuLabel]' })
export class DsDropdownMenuLabel {}

/** Groups related items: `role="group"`. Label it with `aria-labelledby` or `aria-label`. */
@Directive({ selector: '[dsDropdownMenuGroup]', host: { role: 'group' } })
export class DsDropdownMenuGroup {}

/** A divider between groups of items. */
@Directive({
  selector: '[dsDropdownMenuSeparator]',
  host: { role: 'separator', 'aria-orientation': 'horizontal' },
})
export class DsDropdownMenuSeparator {}

// ── Submenus ───────────────────────────────────────────────────────────────────────────────

/**
 * A nested menu: wraps a `dsDropdownMenuSubTrigger` and its `dsDropdownMenuSubContent`. Closes
 * when its parent menu closes.
 */
@Directive({
  selector: '[dsDropdownMenuSub]',
  exportAs: 'dsDropdownMenuSub',
  providers: menuProviders(DsDropdownMenuSub),
})
export class DsDropdownMenuSub extends DsMenuContext {
  /** Whether the submenu is open. Two-way bindable: `[(open)]`. */
  readonly open = model(false);
  override readonly parent = inject(DsMenuContext, { skipSelf: true });
  readonly dir = computed(() => this.parent.dir());
  readonly isSub = true;

  constructor() {
    super();
    effect(() => {
      if (!this.parent.open() && untracked(this.open)) this.open.set(false);
    });
  }

  setOpen(open: boolean) {
    this.open.set(open);
  }
  closeAll() {
    this.parent.closeAll();
  }
}

/**
 * The item that opens a submenu: on hover, click, Enter, Space or ArrowRight (ArrowLeft in
 * RTL). While the pointer travels from it to the open submenu, the items it crosses do not
 * take the highlight (pointer grace).
 */
@Directive({
  selector: '[dsDropdownMenuSubTrigger]',
  exportAs: 'dsDropdownMenuSubTrigger',
  host: {
    role: 'menuitem',
    'aria-haspopup': 'menu',
    '[id]': 'menu.triggerId',
    '[attr.aria-expanded]': 'menu.open()',
    '[attr.aria-controls]': 'menu.open() ? menu.contentId : null',
    '[attr.data-state]': 'state()',
  },
})
export class DsDropdownMenuSubTrigger extends DsMenuItemBase {
  protected override readonly closeOnSelect = false;
  protected readonly state = computed(() => openState(this.menu.open()));

  protected override get owner(): DsMenuContext {
    return this.menu.parent ?? this.menu;
  }

  override ngOnInit() {
    super.ngOnInit();
    this.menu.trigger.set(this.element);
  }
  override ngOnDestroy() {
    super.ngOnDestroy();
    if (this.menu.trigger() === this.element) this.menu.trigger.set(null);
  }

  private openSub(target: MenuFocusTarget) {
    if (!this.disabled()) this.menu.openWith(target);
  }

  protected override onChosen() {
    this.openSub('first');
  }

  protected override onKeyDown(event: KeyboardEvent) {
    super.onKeyDown(event);
    const openKey = this.menu.dir() === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    if (event.key === openKey) {
      event.preventDefault();
      this.openSub('first');
    }
  }

  protected override onPointerMove(event: PointerEvent) {
    if (this.disabled() || event.pointerType === 'touch') return;
    if (this.owner.pointerGrace.blocks(event, this.element)) return;
    if (!this.menu.open()) this.openSub('content');
    super.onPointerMove(event);
  }

  protected override onPointerLeave(event: PointerEvent) {
    const content = this.menu.content();
    if (this.menu.open() && content && event.pointerType !== 'touch') {
      this.owner.pointerGrace.start(this.element, content, {
        x: event.clientX,
        y: event.clientY,
      });
      return;
    }
    super.onPointerLeave(event);
  }
}

/** Every dropdown menu part, for `imports: [...DsDropdownMenuParts]`. */
export const DsDropdownMenuParts = [
  DsDropdownMenu,
  DsDropdownMenuTrigger,
  DsDropdownMenuContent,
  DsDropdownMenuItem,
  DsDropdownMenuCheckboxItem,
  DsDropdownMenuRadioGroup,
  DsDropdownMenuRadioItem,
  DsDropdownMenuItemIndicator,
  DsDropdownMenuLabel,
  DsDropdownMenuGroup,
  DsDropdownMenuSeparator,
  DsDropdownMenuSub,
  DsDropdownMenuSubTrigger,
] as const;
