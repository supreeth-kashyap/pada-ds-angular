import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  numberAttribute,
  OnDestroy,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  dataFlag,
  DsPresence,
  hideFromTopLayer,
  isBrowser,
  openState,
  showInTopLayer,
} from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';
import { ToastRecord, ToastService } from './toast.service';

export type ToasterPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

const TONE_ICON = {
  neutral: null,
  info: 'info',
  success: 'tick_2',
  warning: 'alert_1',
  danger: 'alert_2',
} as const;
/** A sideways swipe further than this (px) dismisses the toast. */
const SWIPE_THRESHOLD = 60;
const GAP = 8;
const PEEK = 10;

/**
 * One toast in the Toaster's list. Internal: the Toaster renders it for each record. Counts
 * down while visible and not paused, closes on Escape, a sideways swipe, its close button or
 * its action, and reports its natural height for the stack layout.
 */
@Component({
  selector: 'li[dsToast]',
  imports: [IconComponent],
  template: `
    <!-- The live region wraps only the message, so button labels are not announced. -->
    <div
      class="toast-message"
      [attr.role]="assertive() ? 'alert' : 'status'"
      [attr.aria-live]="assertive() ? 'assertive' : 'polite'"
      aria-atomic="true"
    >
      @if (icon(); as icon) {
        <ds-icon class="toast-icon" [name]="icon" [size]="16" />
      }
      <div class="toast-body">
        @if (toast().title) {
          <p class="toast-title">{{ toast().title }}</p>
        }
        @if (toast().description) {
          <p class="toast-description">{{ toast().description }}</p>
        }
      </div>
    </div>
    @if (toast().action; as action) {
      <button type="button" class="toast-action" (click)="runAction()">{{ action.label }}</button>
    }
    <button type="button" class="toast-close" aria-label="Dismiss notification" (click)="dismiss()">
      <ds-icon name="cross_1" [size]="12" />
    </button>
    @if (timed()) {
      <span class="toast-timer" aria-hidden="true" [attr.data-paused]="pausedFlag()"></span>
    }
  `,
  styleUrl: './toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    tabindex: '0',
    '[attr.data-tone]': 'toast().tone',
    '[attr.data-state]': 'state()',
    '[attr.data-hidden]': 'hiddenFlag()',
    '[attr.data-front]': 'frontFlag()',
    '[attr.data-swiping]': 'swipingFlag()',
    '[style.--pada-toast-index]': 'indexValue()',
    '[style.--pada-toast-offset]': 'offsetPx()',
    '[style.--pada-toast-swipe]': 'swipePx()',
    '[style.--pada-toast-duration]': 'durationMs()',
    '(keydown)': 'onKeyDown($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp()',
    '(pointercancel)': 'swipe.set(null)',
  },
})
export class ToastItemComponent implements OnDestroy {
  private readonly service = inject(ToastService);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** The toast to render. */
  readonly toast = input.required<ToastRecord>();
  /** Position in the stack, newest first. */
  readonly index = input(0);
  /** Distance from the stack's edge when expanded, in px. */
  readonly offset = input(0);
  /** Beyond `visibleToasts`: kept in the stack but invisible, and its timer waits. */
  readonly stackHidden = input(false);
  /** Hovered, focused or in a background window: the timer pauses. */
  readonly paused = input(false);
  /** The toast's natural height changed, in px. */
  readonly heightChange = output<number>();

  protected readonly swipe = signal<{ start: number; offset: number } | null>(null);
  protected readonly state = computed(() => openState(this.toast().open));
  protected readonly icon = computed(() => TONE_ICON[this.toast().tone]);
  protected readonly assertive = computed(() => this.toast().tone === 'danger');
  protected readonly timed = computed(() => Number.isFinite(this.toast().duration));
  protected readonly hiddenFlag = computed(() => dataFlag(this.stackHidden()));
  protected readonly frontFlag = computed(() => dataFlag(this.index() === 0));
  protected readonly swipingFlag = computed(() => dataFlag(this.swipe() !== null));
  protected readonly pausedFlag = computed(() => dataFlag(this.paused()));
  protected readonly indexValue = computed(() => `${this.index()}`);
  protected readonly offsetPx = computed(() => `${this.offset()}px`);
  protected readonly swipePx = computed(() => `${this.swipe()?.offset ?? 0}px`);
  protected readonly durationMs = computed(() =>
    this.timed() ? `${this.toast().duration}ms` : '0ms',
  );

  constructor() {
    // Count down only while open, visible and not paused; resume where it left off. A record
    // replaced through the same id (an update) starts over with its own duration.
    let record: ToastRecord | null = null;
    let remaining = 0;
    effect((onCleanup) => {
      const toast = this.toast();
      const paused = this.paused();
      const hidden = this.stackHidden();
      if (toast !== record) {
        record = toast;
        remaining = toast.duration;
      }
      if (!toast.open || paused || hidden || !Number.isFinite(toast.duration)) return;
      const startedAt = Date.now();
      const timer = setTimeout(() => this.dismiss(), remaining);
      onCleanup(() => {
        clearTimeout(timer);
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
      });
    });

    // Report the natural height (without the collapsed clamp) for the stack layout.
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const measure = () => this.heightChange.emit(this.element.scrollHeight);
      measure();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(measure);
      observer.observe(this.element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** Removed from the DOM after its exit animation: drop it from the queue. */
  ngOnDestroy() {
    const toast = this.toast();
    if (!toast.open) this.service.remove(toast.id);
  }

  protected dismiss() {
    this.service.dismiss(this.toast().id);
  }

  protected runAction() {
    this.toast().action?.onClick();
    this.dismiss();
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    this.dismiss();
  }

  protected onPointerDown(event: PointerEvent) {
    if ((event.target as Element | null)?.closest('button')) return;
    this.element.setPointerCapture?.(event.pointerId);
    this.swipe.set({ start: event.clientX, offset: 0 });
  }

  protected onPointerMove(event: PointerEvent) {
    const swipe = this.swipe();
    if (swipe) this.swipe.set({ ...swipe, offset: event.clientX - swipe.start });
  }

  protected onPointerUp() {
    const swipe = this.swipe();
    if (swipe && Math.abs(swipe.offset) > SWIPE_THRESHOLD) this.dismiss();
    this.swipe.set(null);
  }
}

/**
 * Renders the toasts created with `ToastService` / `injectToast()`. Put one near the root of
 * the app. Toasts stack in a corner and expand on hover or focus; their timers pause while the
 * stack is hovered or focused, or the window is in the background. Swipe a toast sideways or
 * press Escape on it to dismiss it; the hotkey (F8) moves focus to the newest toast. Each
 * message is a polite `status`, except danger toasts, which are assertive `alert`s.
 *
 * ```html
 * <ds-toaster position="bottom-right" />
 * ```
 *
 * ```ts
 * private readonly toast = injectToast();
 * save() {
 *   this.toast.success({ title: 'Invite sent', description: 'ada@example.com' });
 * }
 * ```
 *
 * Differences from React: titles and descriptions are strings (not React nodes). The region
 * stays where it is rendered and joins the top layer while it has toasts, instead of rendering
 * in a portal. `ToastService.update(id, changes)` (also `toast.update`) changes an open toast in
 * place; updating a toast restarts its timer with the new duration.
 */
@Component({
  selector: 'ds-toaster',
  imports: [DsPresence, ToastItemComponent],
  template: `
    <section
      #region
      class="toaster"
      tabindex="-1"
      data-pada-layer
      [attr.aria-label]="regionLabel()"
      [attr.data-position]="position()"
      [attr.data-vertical]="vertical()"
      [attr.data-horizontal]="horizontal()"
      [attr.data-expanded]="expandedFlag()"
    >
      <ol
        #list
        class="toaster-list"
        [style.--pada-toaster-height]="listHeight()"
        [style.--pada-toast-front-height]="frontHeight()"
        (pointerenter)="hovered.set(true)"
        (pointerleave)="hovered.set(false)"
        (focusin)="focused.set(true)"
        (focusout)="onFocusOut($event)"
      >
        @for (item of ordered(); track item.id; let index = $index) {
          <li
            *dsPresence="item.open"
            dsToast
            [toast]="item"
            [index]="index"
            [offset]="layout().offsets.get(item.id) ?? 0"
            [stackHidden]="index >= visibleToasts()"
            [paused]="paused()"
            (heightChange)="reportHeight(item.id, $event)"
          ></li>
        }
      </ol>
    </section>
  `,
  styleUrl: './toaster.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToasterComponent {
  private readonly service = inject(ToastService);

  /** Corner (or edge) where toasts appear. @default 'bottom-right' */
  readonly position = input<ToasterPosition>('bottom-right');
  /** How many toasts show at once; older ones wait in the stack. @default 3 */
  readonly visibleToasts = input(3, { transform: numberAttribute });
  /** Accessible name of the region. The hotkey is appended: "Notifications (F8)". */
  readonly label = input('Notifications');
  /** Key (`KeyboardEvent.key`) that moves focus to the newest toast. @default 'F8' */
  readonly hotkey = input('F8');

  private readonly region = viewChild.required<ElementRef<HTMLElement>>('region');
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');

  protected readonly hovered = signal(false);
  protected readonly focused = signal(false);
  private readonly windowActive = signal(true);
  private readonly heights = signal<Record<string, number>>({});

  protected readonly regionLabel = computed(() => `${this.label()} (${this.hotkey()})`);
  protected readonly vertical = computed(() => this.position().split('-')[0]);
  protected readonly horizontal = computed(() => this.position().split('-')[1]);
  private readonly expanded = computed(() => this.hovered() || this.focused());
  protected readonly expandedFlag = computed(() => dataFlag(this.expanded()));
  protected readonly paused = computed(() => this.expanded() || !this.windowActive());
  /** Newest first, so the newest sits at the front of the stack. */
  protected readonly ordered = computed(() => [...this.service.toasts()].reverse());

  /** Expanded: each toast sits past the newer ones. Collapsed: they peek behind the front. */
  protected readonly layout = computed(() => {
    const heights = this.heights();
    const ordered = this.ordered();
    const shown = ordered.filter((item, index) => index < this.visibleToasts() && item.open);
    const offsets = new Map<string, number>();
    let running = 0;
    for (const item of ordered) {
      offsets.set(item.id, running);
      if (item.open) running += (heights[item.id] ?? 0) + GAP;
    }
    const front = shown[0] ? (heights[shown[0].id] ?? 0) : 0;
    const height = this.expanded()
      ? Math.max(0, running - GAP)
      : front + Math.max(0, shown.length - 1) * PEEK;
    return { offsets, front, height };
  });
  protected readonly listHeight = computed(() => `${this.layout().height}px`);
  protected readonly frontHeight = computed(() => `${this.layout().front}px`);

  constructor() {
    // Heights of toasts that left the queue are dropped.
    effect(() => {
      const ids = new Set(this.service.toasts().map((item) => item.id));
      untracked(() =>
        this.heights.update((current) =>
          Object.keys(current).every((id) => ids.has(id))
            ? current
            : Object.fromEntries(Object.entries(current).filter(([id]) => ids.has(id))),
        ),
      );
    });

    // While it has toasts the region sits in the top layer, above other floating layers.
    effect(() => {
      const element = this.region().nativeElement;
      const any = this.service.toasts().length > 0;
      untracked(() => (any ? showInTopLayer(element) : hideFromTopLayer(element)));
    });

    if (isBrowser()) {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== this.hotkey()) return;
        const first = this.list().nativeElement.querySelector<HTMLElement>('li[dsToast]');
        if (first) {
          event.preventDefault();
          first.focus();
        }
      };
      const onBlur = () => this.windowActive.set(false);
      const onFocus = () => this.windowActive.set(true);
      document.addEventListener('keydown', onKeyDown);
      window.addEventListener('blur', onBlur);
      window.addEventListener('focus', onFocus);
      inject(DestroyRef).onDestroy(() => {
        document.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('blur', onBlur);
        window.removeEventListener('focus', onFocus);
      });
    }
  }

  protected reportHeight(id: string, height: number) {
    this.heights.update((current) =>
      current[id] === height ? current : { ...current, [id]: height },
    );
  }

  protected onFocusOut(event: FocusEvent) {
    if (!this.list().nativeElement.contains(event.relatedTarget as Node | null))
      this.focused.set(false);
  }
}
