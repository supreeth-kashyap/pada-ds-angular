import {
  afterRenderEffect,
  booleanAttribute,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { injectButtonType } from '../utils/button';
import { byDocumentOrder, dataFlag, focusElement } from '../utils/dom';
import { uniqueId } from '../utils/id';
import { findNextIndex, keyToNavigation } from '../utils/navigation';

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsActivationMode = 'automatic' | 'manual';

interface TabRef {
  element: HTMLElement;
  value: () => string;
  disabled: () => boolean;
}

// Values become part of element ids, so anything outside [A-Za-z0-9_-] is replaced.
const idPart = (value: string) =>
  value.replace(/[^\w-]/g, (character) => `_${character.charCodeAt(0)}`);

/**
 * Holds the selected tab. WAI-ARIA APG: Tabs. Roving focus within the tab list, arrow keys
 * along the orientation, Home/End, disabled tabs skipped, automatic or manual activation, and an
 * optional indicator that tracks the selected tab. Ids are unique per instance.
 *
 * ```html
 * <div dsTabs [(value)]="tab">
 *   <div dsTabsList aria-label="Project">
 *     <button dsTabsTrigger value="overview">Overview</button>
 *     <button dsTabsTrigger value="activity">Activity</button>
 *     <span dsTabsIndicator></span>
 *   </div>
 *   <div dsTabsContent value="overview">…</div>
 *   <div dsTabsContent value="activity">…</div>
 * </div>
 * ```
 *
 * Difference from React: panels always render their children (they are only `hidden`); render
 * heavy panels conditionally with `@if (tabs.value() === '…')`.
 */
@Directive({
  selector: '[dsTabs]',
  exportAs: 'dsTabs',
  host: {
    '[attr.data-orientation]': 'orientation()',
    '[attr.dir]': 'dir()',
  },
})
export class DsTabs {
  /** The selected tab's value. Two-way bindable: `[(value)]`. */
  readonly value = model('');
  /** Arrow keys follow the orientation: Left/Right when horizontal, Up/Down when vertical. */
  readonly orientation = input<TabsOrientation>('horizontal');
  /** `automatic` selects a tab when it receives focus; `manual` waits for Enter or Space. */
  readonly activationMode = input<TabsActivationMode>('automatic');
  /** Reading direction, for horizontal arrow keys. @default 'ltr' */
  readonly dir = input<'ltr' | 'rtl'>('ltr');

  readonly baseId = uniqueId('ds-tabs-');
  readonly list = signal<HTMLElement | null>(null);
  private readonly registered = signal<readonly TabRef[]>([]);
  /** The tabs, in DOM order. */
  readonly tabs = computed(() =>
    [...this.registered()].sort((a, b) => byDocumentOrder(a.element, b.element)),
  );
  /** The tab that takes Tab: the selected one, else the first enabled one. */
  readonly tabStop = computed(() => {
    const tabs = this.tabs();
    const selected = tabs.find((tab) => tab.value() === this.value() && !tab.disabled());
    return (selected ?? tabs.find((tab) => !tab.disabled()))?.value() ?? null;
  });

  triggerId(value: string) {
    return `${this.baseId}-tab-${idPart(value)}`;
  }
  contentId(value: string) {
    return `${this.baseId}-panel-${idPart(value)}`;
  }
  register(tab: TabRef) {
    this.registered.update((tabs) => [...tabs, tab]);
  }
  unregister(tab: TabRef) {
    this.registered.update((tabs) => tabs.filter((entry) => entry !== tab));
  }
}

/** The row (or column) of tabs: `role="tablist"`, with roving focus and Home/End. Name it with `aria-label`. */
@Directive({
  selector: '[dsTabsList]',
  host: {
    role: 'tablist',
    '[attr.aria-orientation]': 'tabs.orientation()',
    '[attr.data-orientation]': 'tabs.orientation()',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class DsTabsList implements OnInit, OnDestroy {
  protected readonly tabs = inject(DsTabs);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Wrap from the last tab to the first and back. @default true */
  readonly loop = input(true, { transform: booleanAttribute });

  ngOnInit() {
    this.tabs.list.set(this.element);
  }
  ngOnDestroy() {
    if (this.tabs.list() === this.element) this.tabs.list.set(null);
  }

  protected onKeyDown(event: KeyboardEvent) {
    const step = keyToNavigation(event.key, this.tabs.orientation(), this.tabs.dir());
    if (!step) return;
    const tabs = this.tabs.tabs().filter((tab) => this.element.contains(tab.element));
    const current = tabs.findIndex((tab) => tab.element === event.target);
    if (current === -1) return;
    const items = tabs.map((tab) => ({
      label: tab.element.textContent ?? '',
      disabled: tab.disabled(),
    }));
    const next = findNextIndex(items, current, step, { loop: this.loop() });
    if (next === -1) return;
    event.preventDefault();
    focusElement(tabs[next].element);
  }
}

/** One tab: `role="tab"`, `aria-selected`, `data-state="active|inactive"`. Selects on press. */
@Directive({
  selector: '[dsTabsTrigger]',
  host: {
    role: 'tab',
    '[id]': 'tabs.triggerId(value())',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-controls]': 'tabs.contentId(value())',
    '[attr.tabindex]': 'tabs.tabStop() === value() ? 0 : -1',
    '[attr.disabled]': 'disabledFlag()',
    '[attr.data-state]': 'selected() ? "active" : "inactive"',
    '[attr.data-disabled]': 'disabledFlag()',
    '[attr.data-orientation]': 'tabs.orientation()',
    '[attr.data-value]': 'value()',
    '(mousedown)': 'onMouseDown($event)',
    '(keydown)': 'onKeyDown($event)',
    '(focus)': 'onFocus()',
  },
})
export class DsTabsTrigger implements OnInit, OnDestroy {
  protected readonly tabs = inject(DsTabs);
  /** The value this tab selects. */
  readonly value = input.required<string>();
  /** Skipped by the arrow keys and cannot be selected. */
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly selected = computed(() => this.tabs.value() === this.value());
  protected readonly disabledFlag = computed(() => dataFlag(this.disabled()));
  private readonly ref: TabRef = {
    element: injectButtonType(),
    value: () => this.value(),
    disabled: () => this.disabled(),
  };

  ngOnInit() {
    this.tabs.register(this.ref);
  }
  ngOnDestroy() {
    this.tabs.unregister(this.ref);
  }

  protected onMouseDown(event: MouseEvent) {
    // Select on press (not on click) like native tabs; ignore right clicks and Ctrl+click.
    if (this.disabled()) event.preventDefault();
    else if (event.button === 0 && !event.ctrlKey) this.tabs.value.set(this.value());
  }
  protected onKeyDown(event: KeyboardEvent) {
    if ((event.key === 'Enter' || event.key === ' ') && !this.disabled())
      this.tabs.value.set(this.value());
  }
  protected onFocus() {
    if (!this.selected() && !this.disabled() && this.tabs.activationMode() === 'automatic')
      this.tabs.value.set(this.value());
  }
}

/**
 * The panel for one tab: `role="tabpanel"`, labelled by its tab, focusable, `hidden` while its
 * tab is not selected.
 */
@Directive({
  selector: '[dsTabsContent]',
  exportAs: 'dsTabsContent',
  host: {
    role: 'tabpanel',
    tabindex: '0',
    '[id]': 'tabs.contentId(value())',
    '[attr.aria-labelledby]': 'tabs.triggerId(value())',
    '[attr.hidden]': 'selected() ? null : ""',
    '[attr.data-state]': 'selected() ? "active" : "inactive"',
    '[attr.data-orientation]': 'tabs.orientation()',
  },
})
export class DsTabsContent {
  protected readonly tabs = inject(DsTabs);
  /** The value of the tab this panel belongs to. */
  readonly value = input.required<string>();
  readonly selected = computed(() => this.tabs.value() === this.value());
}

/**
 * Tracks the selected tab, for a sliding underline or pill. It sets
 * `--pada-tabs-indicator-offset` and `--pada-tabs-indicator-size` (along the list's axis, in px),
 * `data-orientation`, and `data-state="visible|hidden"`. Put it inside the list, position it
 * absolutely and animate those values.
 */
@Directive({
  selector: '[dsTabsIndicator]',
  host: {
    'aria-hidden': 'true',
    '[attr.data-orientation]': 'tabs.orientation()',
    '[attr.data-state]': 'geometry() ? "visible" : "hidden"',
    '[style.--pada-tabs-indicator-offset]': 'offset()',
    '[style.--pada-tabs-indicator-size]': 'size()',
  },
})
export class DsTabsIndicator {
  protected readonly tabs = inject(DsTabs);
  protected readonly geometry = signal<{ offset: number; size: number } | null>(null);
  protected readonly offset = computed(() => `${this.geometry()?.offset ?? 0}px`);
  protected readonly size = computed(() => `${this.geometry()?.size ?? 0}px`);

  constructor() {
    afterRenderEffect(() => {
      this.tabs.value();
      this.tabs.orientation();
      this.tabs.tabs();
      this.measure();
    });
    effect((onCleanup) => {
      const list = this.tabs.list();
      const tabs = this.tabs.tabs();
      if (!list || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(list);
      tabs.forEach((tab) => observer.observe(tab.element));
      onCleanup(() => observer.disconnect());
    });
  }

  private measure() {
    const active = this.tabs.tabs().find((tab) => tab.value() === this.tabs.value());
    const element = active?.element;
    if (!element) {
      this.geometry.set(null);
      return;
    }
    const next =
      this.tabs.orientation() === 'horizontal'
        ? { offset: element.offsetLeft, size: element.offsetWidth }
        : { offset: element.offsetTop, size: element.offsetHeight };
    const current = this.geometry();
    if (current?.offset !== next.offset || current?.size !== next.size) this.geometry.set(next);
  }
}

/** Every tabs part, for `imports: [...DsTabsParts]`. */
export const DsTabsParts = [
  DsTabs,
  DsTabsList,
  DsTabsTrigger,
  DsTabsContent,
  DsTabsIndicator,
] as const;
