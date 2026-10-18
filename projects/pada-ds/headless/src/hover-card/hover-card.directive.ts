import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  model,
  numberAttribute,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FLOATING_INPUTS } from '../popover/popover.directive';
import { DismissEvent } from '../utils/dismissable';
import { openState } from '../utils/dom';
import {
  DsFloating,
  DsFloatingArrow,
  DsFloatingContext,
  injectFloatingLayer,
} from '../utils/floating.directive';

/**
 * A preview card for a link or a name, shown on hover and keyboard focus. Holds the open state
 * and the delays; renders nothing.
 *
 * The card is supplementary: everything in it must also be reachable through the trigger (the
 * profile the link goes to), since touch and screen-reader users may never see it.
 *
 * ```html
 * <ng-container dsHoverCard #card="dsHoverCard" [openDelay]="500">
 *   <a href="/people/ada" dsHoverCardTrigger>@ada</a>
 *   <div *dsPresence="card.open()" dsHoverCardContent [sideOffset]="8">…</div>
 * </ng-container>
 * ```
 */
@Directive({ selector: '[dsHoverCard]', exportAs: 'dsHoverCard', providers: [DsFloatingContext] })
export class DsHoverCard {
  /** Whether the card is open. Two-way bindable: `[(open)]`. */
  readonly open = model(false);
  /** Hover (or focus) time before the card opens, in ms. @default 700 */
  readonly openDelay = input(700, { transform: numberAttribute });
  /** Time after the pointer (or focus) leaves before the card closes, in ms. @default 300 */
  readonly closeDelay = input(300, { transform: numberAttribute });

  /** The trigger element, registered by `dsHoverCardTrigger`. */
  readonly trigger = signal<HTMLElement | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.cancel());
  }

  /** Cancels a pending open or close. */
  cancel() {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }

  /** Opens after `openDelay`. */
  scheduleOpen() {
    this.cancel();
    this.timer = setTimeout(() => this.open.set(true), this.openDelay());
  }

  /** Closes after `closeDelay`, so the pointer can travel to the card. */
  scheduleClose() {
    this.cancel();
    this.timer = setTimeout(() => this.open.set(false), this.closeDelay());
  }

  /** Closes now. */
  close() {
    this.cancel();
    this.open.set(false);
  }
}

/** The link the card previews. Opens the card on hover (not on touch) and on keyboard focus. */
@Directive({
  selector: '[dsHoverCardTrigger]',
  host: {
    '[attr.data-state]': 'state()',
    '(pointerenter)': 'onPointer($event, true)',
    '(pointerleave)': 'onPointer($event, false)',
    '(focus)': 'hoverCard.scheduleOpen()',
    '(blur)': 'hoverCard.scheduleClose()',
  },
})
export class DsHoverCardTrigger implements OnInit, OnDestroy {
  protected readonly hoverCard = inject(DsHoverCard);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly state = computed(() => openState(this.hoverCard.open()));

  ngOnInit() {
    this.hoverCard.trigger.set(this.element);
  }

  ngOnDestroy() {
    if (this.hoverCard.trigger() === this.element) this.hoverCard.trigger.set(null);
  }

  protected onPointer(event: PointerEvent, enter: boolean) {
    if (event.pointerType === 'touch') return;
    if (enter) this.hoverCard.scheduleOpen();
    else this.hoverCard.scheduleClose();
  }
}

/**
 * The card: in the top layer, positioned against the trigger with `data-side` and `data-align`.
 * Stays open while the pointer or focus is on it; closes on Escape and on pointer-down outside.
 * Render it with `*dsPresence="hoverCard.open()"` so it can animate out.
 */
@Directive({
  selector: '[dsHoverCardContent]',
  hostDirectives: [{ directive: DsFloating, inputs: [...FLOATING_INPUTS] }],
  host: {
    'data-pada-layer': '',
    '[attr.data-state]': 'state()',
    '(pointerenter)': 'hoverCard.cancel()',
    '(pointerleave)': 'onPointerLeave($event)',
    '(focusin)': 'hoverCard.cancel()',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class DsHoverCardContent {
  protected readonly hoverCard = inject(DsHoverCard);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly state = computed(() => openState(this.hoverCard.open()));

  /** Escape was pressed. Prevent it to keep the card open. */
  readonly escapeKeyDown = output<DismissEvent<KeyboardEvent>>();

  constructor() {
    const hoverCard = this.hoverCard;
    injectFloatingLayer({
      open: hoverCard.open,
      anchor: () => hoverCard.trigger(),
      dismiss: () => ({
        onDismiss: () => hoverCard.close(),
        onEscapeKeyDown: (event) => this.escapeKeyDown.emit(event),
        onInteractOutside: (event) => {
          const trigger = hoverCard.trigger();
          if (event.target instanceof Node && trigger?.contains(event.target))
            event.preventDefault();
        },
      }),
    });
  }

  protected onPointerLeave(event: PointerEvent) {
    if (event.pointerType !== 'touch') this.hoverCard.scheduleClose();
  }

  protected onFocusOut(event: FocusEvent) {
    if (!this.element.contains(event.relatedTarget as Node | null)) this.hoverCard.scheduleClose();
  }
}

/** Every hover card part, for `imports: [DsHoverCardParts]`. The arrow is `dsFloatingArrow`. */
export const DsHoverCardParts = [
  DsHoverCard,
  DsHoverCardTrigger,
  DsHoverCardContent,
  DsFloatingArrow,
] as const;
