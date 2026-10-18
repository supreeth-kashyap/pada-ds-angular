import {
  booleanAttribute,
  Directive,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { injectButtonType } from '../utils/button';
import { DismissEvent } from '../utils/dismissable';
import { openState } from '../utils/dom';
import { FloatingAnchor } from '../utils/floating';
import {
  DsFloating,
  DsFloatingArrow,
  DsFloatingContext,
  injectFloatingLayer,
} from '../utils/floating.directive';
import { AutoFocusEvent } from '../utils/focus-scope';
import { uniqueId } from '../utils/id';

/** Inputs of `DsFloating`, forwarded by every floating content part. */
export const FLOATING_INPUTS = [
  'side',
  'align',
  'sideOffset',
  'alignOffset',
  'avoidCollisions',
  'collisionPadding',
  'arrowPadding',
  'hideWhenDetached',
] as const;

/**
 * Holds the open state of a popover: a non-modal dialog anchored to a trigger.
 *
 * ```html
 * <ng-container dsPopover #filters="dsPopover">
 *   <button dsPopoverTrigger>Filters</button>
 *   <div *dsPresence="filters.open()" dsPopoverContent side="bottom" align="start" aria-label="Filters">
 *     …
 *     <span dsFloatingArrow></span>
 *   </div>
 * </ng-container>
 * ```
 */
@Directive({ selector: '[dsPopover]', exportAs: 'dsPopover', providers: [DsFloatingContext] })
export class DsPopover {
  /** Whether the popover is open. Two-way bindable: `[(open)]`. */
  readonly open = model(false);
  /** Modal popovers trap focus and hide the rest of the page from assistive technology. */
  readonly modal = input(false, { transform: booleanAttribute });

  readonly contentId = uniqueId('ds-popover-');
  readonly titleId = `${this.contentId}-title`;
  readonly hasTitle = signal(false);
  readonly trigger = signal<HTMLElement | null>(null);
  /** A custom anchor (`dsPopoverAnchor`) or point; the trigger otherwise. */
  readonly anchor = signal<FloatingAnchor | null>(null);

  setOpen(open: boolean) {
    this.open.set(open);
  }
}

/** Toggles the popover. The content is positioned against it unless an anchor is set. */
@Directive({
  selector: '[dsPopoverTrigger]',
  host: {
    'aria-haspopup': 'dialog',
    '[attr.aria-expanded]': 'popover.open()',
    '[attr.aria-controls]': 'popover.open() ? popover.contentId : null',
    '[attr.data-state]': 'state()',
    '(click)': 'toggle($event)',
  },
})
export class DsPopoverTrigger implements OnInit, OnDestroy {
  protected readonly popover = inject(DsPopover);
  private readonly element = injectButtonType();
  protected readonly state = () => openState(this.popover.open());

  ngOnInit() {
    this.popover.trigger.set(this.element);
  }
  ngOnDestroy() {
    if (this.popover.trigger() === this.element) this.popover.trigger.set(null);
  }
  protected toggle(event: Event) {
    if (!event.defaultPrevented) this.popover.setOpen(!this.popover.open());
  }
}

/** Positions the content against this element instead of the trigger. */
@Directive({ selector: '[dsPopoverAnchor]' })
export class DsPopoverAnchor implements OnInit, OnDestroy {
  private readonly popover = inject(DsPopover);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  ngOnInit() {
    this.popover.anchor.set(this.element);
  }
  ngOnDestroy() {
    if (this.popover.anchor() === this.element) this.popover.anchor.set(null);
  }
}

/**
 * The floating panel: `role="dialog"`, in the top layer, positioned against the trigger with
 * `data-side` and `data-align`. Give it an accessible name with `aria-label` or a
 * `dsPopoverTitle`. Render it with `*dsPresence="popover.open()"` so it can animate out.
 */
@Directive({
  selector: '[dsPopoverContent]',
  hostDirectives: [{ directive: DsFloating, inputs: [...FLOATING_INPUTS] }],
  host: {
    role: 'dialog',
    tabindex: '-1',
    'data-pada-layer': '',
    '[id]': 'popover.contentId',
    '[attr.aria-modal]': 'popover.modal() ? "true" : null',
    '[attr.aria-labelledby]': 'popover.hasTitle() ? popover.titleId : null',
    '[attr.data-state]': 'state()',
  },
})
export class DsPopoverContent {
  protected readonly popover = inject(DsPopover);
  protected readonly state = () => openState(this.popover.open());

  /** Focus is about to move in. Prevent it to keep focus where it is. */
  readonly openAutoFocus = output<AutoFocusEvent>();
  /** Focus is about to return to the trigger. Prevent it to focus something else yourself. */
  readonly closeAutoFocus = output<AutoFocusEvent>();
  /** Escape was pressed. Prevent it to keep the popover open. */
  readonly escapeKeyDown = output<DismissEvent<KeyboardEvent>>();
  /** A pointer went down outside. Prevent it to keep the popover open. */
  readonly pointerDownOutside = output<DismissEvent<PointerEvent>>();
  /** Focus moved outside. Prevent it to keep the popover open. */
  readonly focusOutside = output<DismissEvent<FocusEvent>>();
  /** Any interaction outside. Prevent it to keep the popover open. */
  readonly interactOutside = output<DismissEvent<PointerEvent | FocusEvent>>();

  constructor() {
    const popover = this.popover;
    injectFloatingLayer({
      open: popover.open,
      anchor: () => popover.anchor() ?? popover.trigger(),
      dismiss: () => ({
        onDismiss: () => popover.setOpen(false),
        onEscapeKeyDown: (event) => this.escapeKeyDown.emit(event),
        onPointerDownOutside: (event) => this.pointerDownOutside.emit(event),
        onFocusOutside: (event) => this.focusOutside.emit(event),
        dismissOnFocusOutside: !popover.modal(),
        onInteractOutside: (event) => {
          this.interactOutside.emit(event);
          const trigger = popover.trigger();
          if (event.target instanceof Node && trigger?.contains(event.target))
            event.preventDefault();
        },
      }),
      focus: () => ({
        trapped: popover.modal() && popover.open(),
        onMountAutoFocus: (event) => this.openAutoFocus.emit(event),
        onUnmountAutoFocus: (event) => this.closeAutoFocus.emit(event),
      }),
      modal: () => popover.modal(),
    });
  }
}

/** Names the popover: the content gets `aria-labelledby` pointing at it. */
@Directive({ selector: '[dsPopoverTitle]', host: { '[id]': 'popover.titleId' } })
export class DsPopoverTitle implements OnInit, OnDestroy {
  protected readonly popover = inject(DsPopover);
  ngOnInit() {
    this.popover.hasTitle.set(true);
  }
  ngOnDestroy() {
    this.popover.hasTitle.set(false);
  }
}

/** Closes the popover. Give icon-only close buttons an `aria-label`. */
@Directive({ selector: '[dsPopoverClose]', host: { '(click)': 'close($event)' } })
export class DsPopoverClose {
  private readonly popover = inject(DsPopover);
  constructor() {
    injectButtonType();
  }
  protected close(event: Event) {
    if (!event.defaultPrevented) this.popover.setOpen(false);
  }
}

/** Every popover part, for `imports: [DsPopoverParts]`. */
export const DsPopoverParts = [
  DsPopover,
  DsPopoverTrigger,
  DsPopoverAnchor,
  DsPopoverContent,
  DsPopoverTitle,
  DsPopoverClose,
  DsFloatingArrow,
] as const;
