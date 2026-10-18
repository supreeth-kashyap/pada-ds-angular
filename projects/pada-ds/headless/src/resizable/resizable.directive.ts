import {
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  numberAttribute,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { byDocumentOrder, dataFlag } from '../utils/dom';
import { uniqueId } from '../utils/id';

export type ResizableOrientation = 'horizontal' | 'vertical';

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const round = (value: number) => Math.round(value * 1000) / 1000;

/**
 * A group of resizable panels separated by handles (WAI-ARIA APG Window Splitter). Put panels
 * and handles inside it in order: panel, handle, panel, …
 *
 * ```html
 * <div dsResizable (sizesCommit)="save($event)">
 *   <div dsResizablePanel [defaultSize]="25" [minSize]="15" collapsible>Files</div>
 *   <div dsResizableHandle aria-label="Resize file list"></div>
 *   <div dsResizablePanel>Editor</div>
 * </div>
 * ```
 *
 * Sizes are percentages, one per panel. Bind `[sizes]` to control them: the group then only
 * moves when you pass new sizes back (`[(sizes)]` does that for you).
 */
@Directive({
  selector: '[dsResizable]',
  exportAs: 'dsResizable',
  host: {
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-disabled]': 'disabledFlag()',
  },
})
export class DsResizable {
  /** `horizontal` lays panels side by side; `vertical` stacks them. @default 'horizontal' */
  readonly orientation = input<ResizableOrientation>('horizontal');
  /** Controlled panel sizes, in percent, one per panel. Leave unset to let the group keep them. */
  readonly sizes = input<number[] | undefined>(undefined);
  /** Percent moved by each arrow-key press. @default 10 */
  readonly keyboardStep = input(10, { transform: numberAttribute });
  /** Turns off dragging and keyboard resizing. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The new sizes, on every change. */
  readonly sizesChange = output<number[]>();
  /** The sizes once a drag ends or a key press resizes, e.g. to save the layout. */
  readonly sizesCommit = output<number[]>();

  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly disabledFlag = computed(() => dataFlag(this.disabled()));

  private readonly registered = signal<DsResizablePanel[]>([]);
  /** The panels, in document order. */
  readonly panels = computed(() =>
    [...this.registered()].sort((a, b) => byDocumentOrder(a.element, b.element)),
  );
  private readonly own = signal<number[] | null>(null);
  /** Sizes before any change: the panels' `defaultSize`, the rest shared equally. */
  private readonly defaultSizes = computed(() => {
    const given = this.panels().map((panel) => panel.defaultSize());
    const unset = given.filter((size) => size === undefined).length;
    const remaining = 100 - given.reduce<number>((total, size) => total + (size ?? 0), 0);
    return given.map((size) => size ?? (unset ? remaining / unset : 0));
  });
  /** The current panel sizes, in percent. */
  readonly currentSizes = computed(() => {
    const count = this.panels().length;
    const controlled = this.sizes();
    if (controlled && controlled.length === count) return controlled;
    const own = this.own();
    return own && own.length === count ? own : this.defaultSizes();
  });
  // The latest sizes asked for, which a controlling parent may not have passed back yet.
  private pending: number[] | null = null;
  // The size each collapsed panel had before it collapsed, to restore it.
  private readonly beforeCollapse = new Map<number, number>();

  register(panel: DsResizablePanel) {
    this.registered.update((panels) => [...panels, panel]);
  }

  unregister(panel: DsResizablePanel) {
    this.registered.update((panels) => panels.filter((item) => item !== panel));
  }

  /** The panel's limits, or null when there is no panel at `index`. */
  limits(index: number) {
    const panel = this.panels()[index];
    if (!panel) return null;
    return {
      minSize: panel.minSize(),
      maxSize: panel.maxSize(),
      collapsible: panel.collapsible(),
      collapsedSize: panel.collapsedSize(),
    };
  }

  /** Moves the boundary after panel `index` so that panel becomes `target` percent. */
  resize(index: number, target: number) {
    const current = this.currentSizes();
    const next = current[index + 1];
    const own = this.limits(index);
    const neighbour = this.limits(index + 1);
    if (next === undefined || !own || !neighbour) return;
    const pair = current[index] + next;
    // The panel can grow until its neighbour hits its minimum, and shrink until it hits its own.
    const low = Math.max(own.minSize, pair - neighbour.maxSize);
    const high = Math.min(own.maxSize, pair - neighbour.minSize);
    let size = clamp(target, low, high);
    // A collapsible panel dragged well below its minimum snaps shut.
    if (own.collapsible && target < own.minSize / 2) size = own.collapsedSize;
    if (round(size) === round(current[index])) return;
    const updated = current.map((value, position) =>
      position === index ? round(size) : position === index + 1 ? round(pair - size) : value,
    );
    this.pending = updated;
    if (this.sizes() === undefined) this.own.set(updated);
    this.sizesChange.emit(updated);
  }

  /** Reports the sizes through `sizesCommit`. */
  commit() {
    this.sizesCommit.emit(this.pending ?? this.currentSizes());
    this.pending = null;
  }

  /** Collapses a collapsible panel, or restores it to the size it had before. */
  toggleCollapse(index: number) {
    const own = this.limits(index);
    if (!own?.collapsible) return;
    const sizes = this.currentSizes();
    const size = sizes[index];
    if (size <= own.collapsedSize) {
      this.resize(
        index,
        this.beforeCollapse.get(index) ?? Math.max(own.minSize, 100 / sizes.length),
      );
    } else {
      this.beforeCollapse.set(index, size);
      this.resize(index, own.collapsedSize);
    }
    this.commit();
  }
}

/**
 * One panel. Its size is a flex ratio, so handles of any width never overflow the group.
 * `data-state` is `collapsed` or `expanded` for collapsible panels; `data-size` is its rounded
 * size in percent.
 */
@Directive({
  selector: '[dsResizablePanel]',
  exportAs: 'dsResizablePanel',
  host: {
    '[id]': 'id',
    '[attr.data-orientation]': 'root.orientation()',
    '[attr.data-state]': 'state()',
    '[attr.data-size]': 'roundedSize()',
    '[style.flex-grow]': 'size()',
    '[style.flex-shrink]': '1',
    '[style.flex-basis]': '0',
    '[style.min-width]': '0',
    '[style.min-height]': '0',
    '[style.overflow]': '"hidden"',
  },
})
export class DsResizablePanel implements OnInit, OnDestroy {
  /** Initial size in percent. Panels without one share the remaining space. */
  readonly defaultSize = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null || value === '' ? undefined : numberAttribute(value),
  });
  /** Smallest size in percent. @default 0 */
  readonly minSize = input(0, { transform: numberAttribute });
  /** Largest size in percent. @default 100 */
  readonly maxSize = input(100, { transform: numberAttribute });
  /** Lets the panel collapse: Enter on the handle after it, or dragging well below `minSize`. */
  readonly collapsible = input(false, { transform: booleanAttribute });
  /** Size when collapsed, in percent. @default 0 */
  readonly collapsedSize = input(0, { transform: numberAttribute });

  protected readonly root = inject(DsResizable);
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** The element's own id, or a generated one; handles point at it with `aria-controls`. */
  readonly id =
    inject(new HostAttributeToken('id'), { optional: true }) ?? uniqueId('ds-resizable-panel-');

  /** Position among the group's panels. */
  readonly index = computed(() => this.root.panels().indexOf(this));
  /** Size in percent. */
  readonly size = computed(() => this.root.currentSizes()[this.index()] ?? 0);
  protected readonly roundedSize = computed(() => Math.round(this.size()));
  protected readonly state = computed(() =>
    this.collapsible() ? (this.size() <= this.collapsedSize() ? 'collapsed' : 'expanded') : null,
  );

  ngOnInit() {
    this.root.register(this);
  }

  ngOnDestroy() {
    this.root.unregister(this);
  }
}

/**
 * The separator between two panels: `role="separator"`, focusable, controlling the panel before
 * it. Arrow keys resize (they stop at the minimum), Home and End move to the limits, Enter (or a
 * double click) collapses or restores a collapsible panel, and it can be dragged.
 * `data-dragging` is set while dragging. Give it an accessible name that says what it resizes.
 */
@Directive({
  selector: '[dsResizableHandle]',
  host: {
    role: 'separator',
    '[attr.tabindex]': 'root.disabled() ? null : 0',
    '[attr.aria-orientation]': 'horizontal() ? "vertical" : "horizontal"',
    '[attr.aria-controls]': 'panel()?.id ?? null',
    '[attr.aria-valuenow]': 'valueNow()',
    '[attr.aria-valuemin]': 'valueMin()',
    '[attr.aria-valuemax]': 'valueMax()',
    '[attr.aria-disabled]': 'root.disabled() || null',
    '[attr.data-orientation]': 'root.orientation()',
    '[attr.data-dragging]': 'draggingFlag()',
    '[attr.data-disabled]': 'disabledFlag()',
    '(keydown)': 'onKeyDown($event)',
    '(dblclick)': 'onDoubleClick($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerUp($event)',
  },
})
export class DsResizableHandle {
  protected readonly root = inject(DsResizable);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly dragging = signal(false);
  private start = { pointer: 0, size: 0, total: 1 };

  /** Index of the panel before the handle, the one it resizes. */
  private readonly index = computed(
    () =>
      this.root.panels().filter((panel) => byDocumentOrder(panel.element, this.element) === -1)
        .length - 1,
  );
  protected readonly panel = computed(() => this.root.panels()[this.index()] ?? null);
  protected readonly horizontal = computed(() => this.root.orientation() === 'horizontal');
  private readonly size = computed(() => this.root.currentSizes()[this.index()] ?? 0);
  // The handle's range: the panel can shrink to its minimum (or collapse) and grow until the
  // panel after it reaches its own limits.
  private readonly range = computed(() => {
    const index = this.index();
    const own = this.root.limits(index);
    const neighbour = this.root.limits(index + 1);
    if (!own || !neighbour) return { low: 0, high: 100 };
    const pair = this.size() + (this.root.currentSizes()[index + 1] ?? 0);
    return {
      low: Math.max(own.collapsible ? own.collapsedSize : own.minSize, pair - neighbour.maxSize),
      high: Math.min(own.maxSize, pair - neighbour.minSize),
    };
  });
  protected readonly valueNow = computed(() => Math.round(this.size()));
  protected readonly valueMin = computed(() => Math.round(this.range().low));
  protected readonly valueMax = computed(() => Math.round(this.range().high));
  protected readonly draggingFlag = computed(() => dataFlag(this.dragging()));
  protected readonly disabledFlag = computed(() => dataFlag(this.root.disabled()));

  private isRtl() {
    if (!this.horizontal()) return false;
    const view = this.element.ownerDocument.defaultView;
    return view?.getComputedStyle(this.element).direction === 'rtl';
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (this.root.disabled() || event.defaultPrevented) return;
    const index = this.index();
    if (event.key === 'Enter') {
      event.preventDefault();
      this.root.toggleCollapse(index);
      return;
    }
    const rtl = this.isRtl();
    const grow = this.horizontal() ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
    const shrink = this.horizontal() ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
    const { low, high } = this.range();
    const step = this.root.keyboardStep();
    const moves: Record<string, number> = {
      [grow]: this.size() + step,
      [shrink]: this.size() - step,
      Home: low,
      End: high,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    // Arrow keys stop at the minimum; only Enter or Home collapse.
    const minimum = this.root.limits(index)?.minSize ?? 0;
    const target = event.key === 'Home' ? low : Math.max(moves[event.key], minimum);
    this.root.resize(index, target);
    this.root.commit();
  }

  protected onDoubleClick(event: MouseEvent) {
    if (!this.root.disabled() && !event.defaultPrevented) this.root.toggleCollapse(this.index());
  }

  protected onPointerDown(event: PointerEvent) {
    if (this.root.disabled() || event.button !== 0 || event.defaultPrevented) return;
    const box = this.root.element.getBoundingClientRect();
    const total = (this.horizontal() ? box.width : box.height) || 1;
    this.start = {
      pointer: this.horizontal() ? event.clientX : event.clientY,
      size: this.size(),
      total,
    };
    this.element.setPointerCapture?.(event.pointerId);
    this.element.focus({ preventScroll: true });
    this.dragging.set(true);
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent) {
    if (!this.dragging()) return;
    const moved = (this.horizontal() ? event.clientX : event.clientY) - this.start.pointer;
    const delta = ((this.isRtl() ? -moved : moved) / this.start.total) * 100;
    this.root.resize(this.index(), this.start.size + delta);
  }

  protected onPointerUp(event: PointerEvent) {
    if (!this.dragging()) return;
    if (this.element.hasPointerCapture?.(event.pointerId))
      this.element.releasePointerCapture(event.pointerId);
    this.dragging.set(false);
    this.root.commit();
  }
}

/** Every Resizable part, for `imports`. */
export const DsResizableParts = [DsResizable, DsResizablePanel, DsResizableHandle] as const;
