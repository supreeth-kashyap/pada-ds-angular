import {
  booleanAttribute,
  computed,
  Directive,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { byDocumentOrder, dataFlag, focusElement, openState } from '../utils/dom';
import { DsFloatingContext } from '../utils/floating.directive';
import { uniqueId } from '../utils/id';
import { findNextIndex, keyToNavigation } from '../utils/navigation';
import { injectButtonType } from '../utils/button';
import { DsMenuContext, MenuDirection } from '../menu/menu.directive';

interface MenubarTriggerRef {
  element: HTMLElement;
  menu: DsMenubarMenu;
  disabled: () => boolean;
}

/**
 * A horizontal bar of menus, as in a desktop application (WAI-ARIA APG Menubar):
 * `role="menubar"` with one Tab stop. Arrow keys move along the bar and, once a menu is open,
 * between open menus; hovering another trigger while a menu is open switches to it. Name it with
 * `aria-label`. Inside each menu use `dsDropdownMenuContent` and the dropdown menu items.
 *
 * ```html
 * <div dsMenubar aria-label="Editor">
 *   <ng-container dsMenubarMenu value="file" #file="dsMenubarMenu">
 *     <button dsMenubarTrigger>File</button>
 *     <div *dsPresence="file.open()" dsDropdownMenuContent>
 *       <div dsDropdownMenuItem (select)="newFile()">New file</div>
 *     </div>
 *   </ng-container>
 * </div>
 * ```
 */
@Directive({
  selector: '[dsMenubar]',
  exportAs: 'dsMenubar',
  host: {
    role: 'menubar',
    'aria-orientation': 'horizontal',
    '[attr.dir]': 'dir()',
  },
})
export class DsMenubar {
  /** The open menu's `value`, or `''` when every menu is closed. Two-way bindable: `[(value)]`. */
  readonly value = model('');
  /** Wrap focus from the last menu to the first and back. @default true */
  readonly loop = input(true, { transform: booleanAttribute });
  /** Reading direction, for arrow keys and submenu placement. @default 'ltr' */
  readonly dir = input<MenuDirection>('ltr');

  private readonly triggers = signal<readonly MenubarTriggerRef[]>([]);
  private readonly focused = signal('');

  /** The trigger that takes Tab: the last focused one, else the first enabled one. */
  readonly tabStop = computed(() => {
    const triggers = this.sorted().filter((trigger) => !trigger.disabled());
    const focused = triggers.find((trigger) => trigger.menu.value() === this.focused());
    return (focused ?? triggers[0])?.menu.value() ?? '';
  });

  register(trigger: MenubarTriggerRef) {
    this.triggers.update((triggers) => [...triggers, trigger]);
  }
  unregister(trigger: MenubarTriggerRef) {
    this.triggers.update((triggers) => triggers.filter((entry) => entry !== trigger));
  }
  sorted(): MenubarTriggerRef[] {
    return [...this.triggers()].sort((a, b) => byDocumentOrder(a.element, b.element));
  }
  setTabStop(value: string) {
    this.focused.set(value);
  }

  /** Opens the menu after (`step` 1) or before (-1) `from`, focusing its first item. */
  openAdjacent(from: string, step: 1 | -1) {
    const triggers = this.sorted().filter((trigger) => !trigger.disabled());
    const index = triggers.findIndex((trigger) => trigger.menu.value() === from);
    if (index === -1) return;
    let next = index + step;
    if (next < 0 || next >= triggers.length) {
      if (!this.loop()) return;
      next = (next + triggers.length) % triggers.length;
    }
    const menu = triggers[next].menu;
    menu.focusOnOpen = 'first';
    this.focused.set(menu.value());
    this.value.set(menu.value());
  }
}

/** One menu in the bar: a `dsMenubarTrigger` and its `dsDropdownMenuContent`. */
@Directive({
  selector: '[dsMenubarMenu]',
  exportAs: 'dsMenubarMenu',
  providers: [{ provide: DsMenuContext, useExisting: DsMenubarMenu }, DsFloatingContext],
})
export class DsMenubarMenu extends DsMenuContext {
  private readonly menubar = inject(DsMenubar);
  /** Identifies the menu for the menubar's `value`. Generated when omitted. */
  readonly value = input(uniqueId('ds-menubar-menu-'));
  readonly open = computed(() => this.menubar.value() === this.value());
  readonly dir = computed(() => this.menubar.dir());
  readonly isSub = false;

  setOpen(open: boolean) {
    if (open) this.menubar.value.set(this.value());
    // A menu that already lost its place to another one does not close that one.
    else if (this.open()) this.menubar.value.set('');
  }
  closeAll() {
    this.setOpen(false);
  }
  override openAdjacent(step: 1 | -1) {
    this.menubar.openAdjacent(this.value(), step);
  }
}

/**
 * The menu's name in the bar: `role="menuitem"` with a popup and a roving `tabindex`. Click,
 * Enter, Space or ArrowDown opens it (ArrowUp onto the last item); ArrowLeft, ArrowRight, Home
 * and End move along the bar.
 */
@Directive({
  selector: '[dsMenubarTrigger]',
  host: {
    role: 'menuitem',
    'aria-haspopup': 'menu',
    'data-pada-menubar-trigger': '',
    '[id]': 'menu.triggerId',
    '[attr.aria-expanded]': 'menu.open()',
    '[attr.aria-controls]': 'menu.open() ? menu.contentId : null',
    '[attr.tabindex]': 'menubar.tabStop() === menu.value() ? 0 : -1',
    '[attr.data-value]': 'menu.value()',
    '[attr.data-state]': 'state()',
    '[attr.data-disabled]': 'disabledFlag()',
    '[attr.disabled]': 'disabledFlag()',
    '(focus)': 'menubar.setTabStop(menu.value())',
    '(click)': 'onClick($event)',
    '(pointerenter)': 'onPointerEnter()',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class DsMenubarTrigger implements OnInit, OnDestroy {
  protected readonly menubar = inject(DsMenubar);
  protected readonly menu = inject(DsMenubarMenu);
  private readonly element = injectButtonType();
  /** Skipped by the arrow keys and cannot open. */
  readonly disabled = input(false, { transform: booleanAttribute });
  protected readonly state = computed(() => openState(this.menu.open()));
  protected readonly disabledFlag = computed(() => dataFlag(this.disabled()));
  private readonly ref: MenubarTriggerRef = {
    element: this.element,
    menu: this.menu,
    disabled: () => this.disabled(),
  };

  ngOnInit() {
    this.menu.trigger.set(this.element);
    this.menubar.register(this.ref);
  }
  ngOnDestroy() {
    if (this.menu.trigger() === this.element) this.menu.trigger.set(null);
    this.menubar.unregister(this.ref);
  }

  protected onClick(event: MouseEvent) {
    if (event.detail === 0 || this.disabled()) return;
    if (this.menu.open()) this.menu.setOpen(false);
    else this.menu.openWith('content');
  }

  protected onPointerEnter() {
    // Moving across the bar while a menu is open switches menus, as in desktop apps.
    if (this.disabled() || !this.menubar.value() || this.menu.open()) return;
    focusElement(this.element);
    this.menu.openWith('content');
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (this.disabled()) return;
    if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      this.menu.openWith('first');
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.menu.openWith('last');
      return;
    }
    const step = keyToNavigation(event.key, 'horizontal', this.menubar.dir());
    if (!step) return;
    event.preventDefault();
    const triggers = this.menubar.sorted();
    const descriptors = triggers.map((trigger) => ({
      label: trigger.element.textContent ?? '',
      disabled: trigger.disabled(),
    }));
    const next = findNextIndex(descriptors, triggers.indexOf(this.ref), step, {
      loop: this.menubar.loop(),
    });
    if (next !== -1) focusElement(triggers[next].element);
  }
}

/** Every menubar part, for `imports`. Add the dropdown menu content and items inside. */
export const DsMenubarParts = [DsMenubar, DsMenubarMenu, DsMenubarTrigger] as const;
