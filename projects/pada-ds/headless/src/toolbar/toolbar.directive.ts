import {
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { byDocumentOrder, focusElement } from '../utils/dom';
import { findNextIndex, keyToNavigation } from '../utils/navigation';

interface ToolbarItemRef {
  element: HTMLElement;
}

const isDisabled = (element: HTMLElement) =>
  element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true';

/**
 * A row of controls (`role="toolbar"`). WAI-ARIA APG Toolbar: the toolbar is one tab stop, and
 * the arrow keys along its orientation (plus Home/End) move between its `dsToolbarItem`s,
 * skipping disabled ones. Tab returns to the item focused last. Name it with `aria-label` when
 * the page has more than one toolbar.
 *
 * ```html
 * <div dsToolbar aria-label="Filters">
 *   <button dsToolbarItem>Status</button>
 *   <button dsToolbarItem>Owner</button>
 *   <button dsToolbarItem>Export</button>
 * </div>
 * ```
 *
 * Items register with the toolbar through DI, so items inside your components (a filter chip's
 * button) take part too. Controls that handle the arrow keys themselves (a segment control, a
 * text field) can sit in the toolbar without `dsToolbarItem`; they keep their own tab stop.
 */
@Directive({
  selector: '[dsToolbar]',
  exportAs: 'dsToolbar',
  host: {
    role: 'toolbar',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.data-orientation]': 'orientation()',
    '(keydown)': 'onKeyDown($event)',
    '(focusin)': 'onFocusIn($event)',
  },
})
export class DsToolbar {
  /** Which arrow keys move: Left/Right when horizontal, Up/Down when vertical. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /** Wrap from the last item to the first and back. @default true */
  readonly loop = input(true, { transform: booleanAttribute });
  /** Reading direction, for horizontal arrow keys. @default 'ltr' */
  readonly dir = input<'ltr' | 'rtl'>('ltr');

  private readonly registered = signal<readonly ToolbarItemRef[]>([]);
  private readonly active = signal<ToolbarItemRef | null>(null);
  // Bumped on focus changes so the tab stop re-checks which items are disabled.
  private readonly revision = signal(0);

  /** The items, in DOM order. */
  readonly items = computed(() =>
    [...this.registered()].sort((a, b) => byDocumentOrder(a.element, b.element)),
  );
  /** The item that takes Tab: the one focused last, else the first enabled one. */
  readonly tabStop = computed(() => {
    this.revision();
    const items = this.items();
    const active = this.active();
    if (active && items.includes(active) && !isDisabled(active.element)) return active;
    return items.find((item) => !isDisabled(item.element)) ?? items[0] ?? null;
  });

  register(item: ToolbarItemRef) {
    this.registered.update((items) => [...items, item]);
  }
  unregister(item: ToolbarItemRef) {
    this.registered.update((items) => items.filter((entry) => entry !== item));
    if (this.active() === item) this.active.set(null);
  }

  protected onFocusIn(event: FocusEvent) {
    const item = this.items().find((entry) => entry.element === event.target);
    if (item) this.active.set(item);
    this.revision.update((value) => value + 1);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const items = this.items();
    const current = items.findIndex((item) => item.element === event.target);
    if (current === -1) return;
    const step = keyToNavigation(event.key, this.orientation(), this.dir());
    if (!step) return;
    const next = findNextIndex(
      items.map((item) => ({
        label: item.element.textContent ?? '',
        disabled: isDisabled(item.element),
      })),
      current,
      step,
      { loop: this.loop() },
    );
    if (next === -1) return;
    event.preventDefault();
    this.active.set(items[next]);
    focusElement(items[next].element);
  }
}

/**
 * A control in a `dsToolbar`: it takes part in the toolbar's roving focus (`tabindex` 0 on the
 * tab stop, -1 on the rest). Outside a toolbar it does nothing.
 */
@Directive({
  selector: '[dsToolbarItem]',
  host: { '[attr.tabindex]': 'tabIndex()' },
})
export class DsToolbarItem implements OnInit, OnDestroy {
  private readonly toolbar = inject(DsToolbar, { optional: true });
  private readonly ref: ToolbarItemRef = {
    element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
  };
  protected readonly tabIndex = computed(() =>
    this.toolbar ? (this.toolbar.tabStop() === this.ref ? 0 : -1) : null,
  );

  ngOnInit() {
    this.toolbar?.register(this.ref);
  }
  ngOnDestroy() {
    this.toolbar?.unregister(this.ref);
  }
}

/** Every toolbar part, for `imports: [...DsToolbarParts]`. */
export const DsToolbarParts = [DsToolbar, DsToolbarItem] as const;
