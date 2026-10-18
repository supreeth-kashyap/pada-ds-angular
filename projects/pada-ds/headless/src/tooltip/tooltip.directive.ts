import {
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  inject,
  InjectionToken,
  input,
  model,
  numberAttribute,
  OnDestroy,
  OnInit,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FLOATING_INPUTS } from '../popover/popover.directive';
import { DismissEvent } from '../utils/dismissable';
import { isBrowser, openState } from '../utils/dom';
import {
  DsFloating,
  DsFloatingArrow,
  DsFloatingContext,
  injectFloatingLayer,
} from '../utils/floating.directive';
import { uniqueId } from '../utils/id';

/** Open delays shared by a group of tooltips. Provided by `dsTooltipProvider`. */
export interface TooltipDelays {
  /** Hover time before a tooltip opens, in ms. */
  delayDuration(): number;
  /** After a tooltip closes, others open instantly for this long, in ms. */
  skipDelayDuration(): number;
  /** True for `skipDelayDuration` ms after any tooltip in the group closed. */
  isWarm(): boolean;
  /** A tooltip in the group closed. */
  onClose(): void;
}

/** The delays a tooltip root uses: the nearest `dsTooltipProvider`, else the defaults. */
export const DS_TOOLTIP_DELAYS = new InjectionToken<TooltipDelays>('DsTooltipDelays');

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Delays for a group of tooltips: moving from one trigger to the next skips the delay. */
export function createTooltipDelays(
  delayDuration: () => number,
  skipDelayDuration: () => number,
): TooltipDelays {
  let lastClosed = -Infinity;
  return {
    delayDuration,
    skipDelayDuration,
    isWarm: () => now() - lastClosed < skipDelayDuration(),
    onClose: () => {
      lastClosed = now();
    },
  };
}

/** Tooltips outside any provider share this group: 700ms delay, 300ms skip (as in React). */
const defaultDelays = createTooltipDelays(
  () => 700,
  () => 300,
);

/**
 * Shares open delays between the tooltips inside it: once one has closed, moving to the next
 * trigger within `skipDelayDuration` opens that one immediately. Put it on any wrapper, or an
 * `<ng-container>`, around the tooltips (usually once near the app root).
 *
 * ```html
 * <ng-container dsTooltipProvider [delayDuration]="500">…</ng-container>
 * ```
 */
@Directive({
  selector: '[dsTooltipProvider]',
  exportAs: 'dsTooltipProvider',
  providers: [{ provide: DS_TOOLTIP_DELAYS, useExisting: forwardRef(() => DsTooltipProvider) }],
})
export class DsTooltipProvider implements TooltipDelays {
  /** Hover time before a tooltip opens, in ms. @default 700 */
  readonly delayDuration = input(700, { transform: numberAttribute });
  /** After a tooltip closes, others open instantly for this long, in ms. @default 300 */
  readonly skipDelayDuration = input(300, { transform: numberAttribute });

  private readonly group = createTooltipDelays(this.delayDuration, this.skipDelayDuration);
  isWarm() {
    return this.group.isWarm();
  }
  onClose() {
    this.group.onClose();
  }
}

/** Grace period after the pointer leaves the trigger, so it can reach hoverable content. */
const GRACE_MS = 120;

/**
 * Holds the state of one tooltip. Renders nothing; put it on a wrapper or an `<ng-container>`
 * around the trigger and the content. WAI-ARIA APG: Tooltip.
 *
 * ```html
 * <ng-container dsTooltip #tip="dsTooltip">
 *   <button dsTooltipTrigger aria-label="Delete">…</button>
 *   <div *dsPresence="tip.open()" dsTooltipContent side="top">Delete permanently</div>
 * </ng-container>
 * ```
 *
 * The content defaults to `side="bottom"` like every floating part here (React's headless
 * tooltip defaults to `top`; the styled `ds-tooltip-content` does).
 */
@Directive({ selector: '[dsTooltip]', exportAs: 'dsTooltip', providers: [DsFloatingContext] })
export class DsTooltip {
  /** Whether the tooltip is open. Two-way bindable: `[(open)]`. */
  readonly open = model(false);
  /** Overrides the provider's hover delay, in ms. */
  readonly delayDuration = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null || value === '' ? undefined : numberAttribute(value),
  });
  /** Close as soon as the pointer leaves the trigger, even towards the content. */
  readonly disableHoverableContent = input(false, { transform: booleanAttribute });

  readonly contentId = uniqueId('ds-tooltip-');
  /** The trigger element, registered by `dsTooltipTrigger`. */
  readonly trigger = signal<HTMLElement | null>(null);

  private readonly delays = inject(DS_TOOLTIP_DELAYS, { optional: true }) ?? defaultDelays;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Any close (ours or the consumer's) warms the group, so the next trigger opens instantly.
    let wasOpen = untracked(this.open);
    effect(() => {
      const open = this.open();
      if (wasOpen && !open) untracked(() => this.delays.onClose());
      wasOpen = open;
    });
    inject(DestroyRef).onDestroy(() => this.cancelPending());
  }

  /** Cancels a pending open or close. */
  cancelPending() {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }

  /** Opens now, or after the delay (skipped while the group is warm). */
  requestOpen(immediate: boolean) {
    this.cancelPending();
    const delay = this.delayDuration() ?? this.delays.delayDuration();
    if (immediate || delay <= 0 || this.delays.isWarm()) this.open.set(true);
    else this.timer = setTimeout(() => this.open.set(true), delay);
  }

  /** Closes now, or after a short grace period so the pointer can reach the content. */
  requestClose(immediate: boolean) {
    this.cancelPending();
    if (immediate) this.open.set(false);
    else this.timer = setTimeout(() => this.open.set(false), GRACE_MS);
  }
}

/**
 * The element the tooltip describes; it must be focusable (a button, link or input). Opens the
 * tooltip on hover after the delay (not on touch) and immediately on keyboard focus; closes it
 * on pointer leave, blur, pointer-down and Escape. While the tooltip is open the content's id is
 * added to the element's `aria-describedby`, keeping any ids already there.
 */
@Directive({
  selector: '[dsTooltipTrigger]',
  host: {
    '[attr.data-state]': 'state()',
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'tooltip.requestClose(tooltip.disableHoverableContent())',
    '(pointerdown)': 'onPointerDown()',
    '(focus)': 'onFocus()',
    '(blur)': 'tooltip.requestClose(true)',
  },
})
export class DsTooltipTrigger implements OnInit, OnDestroy {
  protected readonly tooltip = inject(DsTooltip);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly state = computed(() => openState(this.tooltip.open()));
  private pointerDown = false;

  constructor() {
    // Merged into whatever aria-describedby the element already has, rather than replacing it.
    effect(() => {
      const open = this.tooltip.open();
      const id = this.tooltip.contentId;
      const tokens = (this.element.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((token) => token && token !== id);
      if (open) tokens.push(id);
      if (tokens.length) this.element.setAttribute('aria-describedby', tokens.join(' '));
      else this.element.removeAttribute('aria-describedby');
    });
  }

  ngOnInit() {
    this.tooltip.trigger.set(this.element);
  }

  ngOnDestroy() {
    if (this.tooltip.trigger() === this.element) this.tooltip.trigger.set(null);
  }

  protected onPointerEnter(event: PointerEvent) {
    if (event.pointerType !== 'touch') this.tooltip.requestOpen(false);
  }

  protected onPointerDown() {
    this.pointerDown = true;
    this.tooltip.requestClose(true);
    if (isBrowser()) setTimeout(() => (this.pointerDown = false), 0);
  }

  protected onFocus() {
    // Focus that comes from a click is not keyboard focus; do not reopen.
    if (!this.pointerDown) this.tooltip.requestOpen(true);
  }
}

/**
 * The tooltip bubble: `role="tooltip"`, in the top layer, positioned against the trigger with
 * `data-side` and `data-align`. Never put interactive content in it. Render it with
 * `*dsPresence="tooltip.open()"` so it can animate out. It leaves focus where it is and does not
 * close when focus moves (the trigger keeps it); a pointer-down anywhere else closes it.
 */
@Directive({
  selector: '[dsTooltipContent]',
  hostDirectives: [{ directive: DsFloating, inputs: [...FLOATING_INPUTS] }],
  host: {
    role: 'tooltip',
    'data-pada-layer': '',
    '[id]': 'tooltip.contentId',
    '[attr.data-state]': 'state()',
    '[style.pointer-events]': 'tooltip.disableHoverableContent() ? "none" : null',
    '(pointerenter)': 'tooltip.cancelPending()',
    '(pointerleave)': 'tooltip.requestClose(false)',
  },
})
export class DsTooltipContent {
  protected readonly tooltip = inject(DsTooltip);
  protected readonly state = computed(() => openState(this.tooltip.open()));

  /** Escape was pressed. Prevent it to keep the tooltip open. */
  readonly escapeKeyDown = output<DismissEvent<KeyboardEvent>>();

  constructor() {
    const tooltip = this.tooltip;
    injectFloatingLayer({
      open: tooltip.open,
      anchor: () => tooltip.trigger(),
      dismiss: () => ({
        onDismiss: () => tooltip.requestClose(true),
        onEscapeKeyDown: (event) => this.escapeKeyDown.emit(event),
        // The trigger handles its own pointer-down (it closes the tooltip too).
        onInteractOutside: (event) => {
          const trigger = tooltip.trigger();
          if (event.target instanceof Node && trigger?.contains(event.target))
            event.preventDefault();
        },
      }),
    });
  }
}

/** Every tooltip part, for `imports: [DsTooltipParts]`. The arrow is `dsFloatingArrow`. */
export const DsTooltipParts = [
  DsTooltipProvider,
  DsTooltip,
  DsTooltipTrigger,
  DsTooltipContent,
  DsFloatingArrow,
] as const;
