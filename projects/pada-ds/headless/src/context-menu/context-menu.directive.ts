import {
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { dataFlag, openState } from '../utils/dom';
import { FloatingAnchor } from '../utils/floating';
import { DsFloatingContext } from '../utils/floating.directive';
import { DsMenuContext, MenuDirection } from '../menu/menu.directive';

/** A zero-size box at a point, for Floating UI. */
const pointAnchor = (x: number, y: number): FloatingAnchor => ({
  getBoundingClientRect: () =>
    ({ x, y, width: 0, height: 0, top: y, left: x, right: x, bottom: y }) as DOMRect,
});

const LONG_PRESS_MS = 600;
const LONG_PRESS_SLOP = 10;

/**
 * Holds the state for a context menu: the same menu as the dropdown menu (use
 * `dsDropdownMenuContent`, its items and submenus), opened at the pointer from a
 * `dsContextMenuTrigger` area. Name the content with `aria-label`: there is no trigger button
 * to label it.
 *
 * ```html
 * <ng-container dsContextMenu #menu="dsContextMenu">
 *   <div dsContextMenuTrigger tabindex="0">Right-click this card</div>
 *   <div *dsPresence="menu.open()" dsDropdownMenuContent aria-label="Card actions">
 *     <div dsDropdownMenuItem (select)="copy()">Copy</div>
 *   </div>
 * </ng-container>
 * ```
 */
@Directive({
  selector: '[dsContextMenu]',
  exportAs: 'dsContextMenu',
  providers: [{ provide: DsMenuContext, useExisting: DsContextMenu }, DsFloatingContext],
})
export class DsContextMenu extends DsMenuContext {
  /** Whether the menu is open. Two-way bindable: `[(open)]`. */
  readonly open = model(false);
  /** Reading direction, for arrow keys and submenu placement. @default 'ltr' */
  readonly dir = input<MenuDirection>('ltr');
  readonly isSub = false;
  private readonly point = signal<FloatingAnchor | null>(null);
  override readonly anchor = computed(() => this.point() ?? pointAnchor(0, 0));

  setOpen(open: boolean) {
    this.open.set(open);
  }
  closeAll() {
    this.setOpen(false);
  }
  /** Opens the menu at a viewport point, focusing its first item. */
  openAt(x: number, y: number) {
    this.point.set(pointAnchor(x, y));
    this.openWith('first');
  }
}

/**
 * The area that opens the menu: right-click opens it at the pointer, Shift+F10 or the
 * ContextMenu key at the focused element, and a long press on touch screens. Make it focusable
 * (`tabindex="0"`) for keyboard users.
 */
@Directive({
  selector: '[dsContextMenuTrigger]',
  host: {
    '[attr.data-state]': 'state()',
    '[attr.data-disabled]': 'disabledFlag()',
    '(contextmenu)': 'onContextMenu($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'cancelPress()',
    '(pointercancel)': 'cancelPress()',
  },
})
export class DsContextMenuTrigger implements OnInit, OnDestroy {
  private readonly menu = inject(DsContextMenu);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Let the browser's own context menu show instead. */
  readonly disabled = input(false, { transform: booleanAttribute });
  protected readonly state = computed(() => openState(this.menu.open()));
  protected readonly disabledFlag = computed(() => dataFlag(this.disabled()));
  private press: { x: number; y: number; timer: ReturnType<typeof setTimeout> } | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.cancelPress());
  }

  ngOnInit() {
    this.menu.trigger.set(this.element);
  }
  ngOnDestroy() {
    if (this.menu.trigger() === this.element) this.menu.trigger.set(null);
  }

  protected onContextMenu(event: MouseEvent) {
    if (this.disabled()) return;
    event.preventDefault();
    this.cancelPress();
    // From the keyboard there is no pointer position: open at the focused element.
    if (event.clientX === 0 && event.clientY === 0) {
      const box = (event.target as HTMLElement).getBoundingClientRect();
      this.menu.openAt(box.left, box.bottom);
    } else {
      this.menu.openAt(event.clientX, event.clientY);
    }
  }

  protected onPointerDown(event: PointerEvent) {
    if (this.disabled() || event.pointerType !== 'touch') return;
    const { clientX: x, clientY: y } = event;
    this.cancelPress();
    this.press = { x, y, timer: setTimeout(() => this.menu.openAt(x, y), LONG_PRESS_MS) };
  }

  protected onPointerMove(event: PointerEvent) {
    const press = this.press;
    if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > LONG_PRESS_SLOP)
      this.cancelPress();
  }

  protected cancelPress() {
    if (this.press) clearTimeout(this.press.timer);
    this.press = null;
  }
}

/** The context menu root and trigger, for `imports`. Add the dropdown menu parts inside. */
export const DsContextMenuParts = [DsContextMenu, DsContextMenuTrigger] as const;
