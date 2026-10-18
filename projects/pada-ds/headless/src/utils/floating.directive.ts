import {
  afterNextRender,
  booleanAttribute,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injectable,
  input,
  numberAttribute,
  OnDestroy,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import { createDismissable, DismissableOptions } from './dismissable';
import { showInTopLayer } from './dom';
import { createFloating, FloatingAnchor, type Align, type Side } from './floating';
import { createFocusScope, FocusScope, FocusScopeOptions } from './focus-scope';
import { hideOthers } from './modal';

/**
 * Shared between a floating part and the parts inside it, through the root directive's
 * providers (`providers: [DsFloatingContext]`). Parts inside the content register with the
 * root, never with the content itself: a styled component renders its content element in its
 * own template, where projected children cannot inject it.
 */
@Injectable()
export class DsFloatingContext {
  /** The arrow element, registered by `dsFloatingArrow`. */
  readonly arrow = signal<HTMLElement | null>(null);
  /** The side and alignment after collision handling. */
  readonly placedSide = signal<Side>('bottom');
  readonly placedAlign = signal<Align>('center');
}

/**
 * Anchored positioning for a floating part: the inputs every floating content part shares
 * (`side`, `align`, offsets, collision handling) and its resolved `data-side` / `data-align`.
 * Content directives (`dsPopoverContent`, `dsMenuContent`, `dsTooltipContent` …) include it as a
 * host directive; use it directly only to build a new floating part.
 */
@Directive({
  selector: '[dsFloating]',
  host: {
    '[attr.data-side]': 'placedSide()',
    '[attr.data-align]': 'placedAlign()',
  },
})
export class DsFloating {
  /** Preferred side of the anchor. Flips to the opposite side when there is no room. */
  readonly side = input<Side>('bottom');
  /** Alignment along the side. */
  readonly align = input<Align>('center');
  /** Gap between anchor and content, in px. */
  readonly sideOffset = input(4, { transform: numberAttribute });
  /** Shift along the alignment axis, in px. */
  readonly alignOffset = input(0, { transform: numberAttribute });
  /** Flip and shift to stay in the viewport. */
  readonly avoidCollisions = input(true, { transform: booleanAttribute });
  /** Distance to keep from the viewport edges, in px. */
  readonly collisionPadding = input(8, { transform: numberAttribute });
  /** Size of the arrow, so it stays inside rounded corners. */
  readonly arrowPadding = input(0, { transform: numberAttribute });
  /** Hide the content when its anchor scrolls out of view. */
  readonly hideWhenDetached = input(false, { transform: booleanAttribute });

  /** Shared with the arrow; provided by the root part. */
  readonly context = inject(DsFloatingContext, { optional: true }) ?? new DsFloatingContext();
  /** The side and alignment after collision handling. */
  readonly placedSide = this.context.placedSide;
  readonly placedAlign = this.context.placedAlign;

  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Positions the element against the anchor until the returned cleanup runs. */
  position(anchor: FloatingAnchor): () => void {
    return createFloating(
      anchor,
      this.element,
      () => ({
        side: this.side(),
        align: this.align(),
        sideOffset: this.sideOffset(),
        alignOffset: this.alignOffset(),
        avoidCollisions: this.avoidCollisions(),
        collisionPadding: this.collisionPadding(),
        arrowPadding: this.arrowPadding(),
        hideWhenDetached: this.hideWhenDetached(),
      }),
      ({ side, align }) => {
        this.placedSide.set(side);
        this.placedAlign.set(align);
      },
      () => this.context.arrow(),
    );
  }
}

/** Arrow pointing at the anchor, positioned automatically; style its size and shape. */
@Directive({
  selector: '[dsFloatingArrow]',
  host: { 'aria-hidden': 'true', '[attr.data-side]': 'context.placedSide()' },
})
export class DsFloatingArrow implements OnInit, OnDestroy {
  protected readonly context = inject(DsFloatingContext);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  ngOnInit() {
    this.context.arrow.set(this.element);
  }
  ngOnDestroy() {
    if (this.context.arrow() === this.element) this.context.arrow.set(null);
  }
}

export interface FloatingLayerConfig {
  /** Whether the layer is open. While false (during its exit animation) it stops dismissing. */
  open: Signal<boolean>;
  /** The element to position against. */
  anchor: () => FloatingAnchor | null | undefined;
  /** Escape / outside-click handling. Omit for layers that never dismiss themselves (tooltips). */
  dismiss?: () => DismissableOptions;
  /** Focus management. Omit for layers that leave focus where it is (tooltips, hover cards). */
  focus?: () => FocusScopeOptions;
  /** Hide the rest of the page from assistive technology while mounted (modal popovers). */
  modal?: () => boolean;
}

/**
 * Shows a floating content part: puts it in the top layer, positions it against its anchor,
 * dismisses it on Escape and outside clicks while open, and moves focus in and back out.
 * Call it from the constructor of a content directive that has `DsFloating` as a host directive.
 */
export function injectFloatingLayer(config: FloatingLayerConfig) {
  const floating = inject(DsFloating);
  const element = floating.element;
  const mounted = signal(false);
  const cleanups: (() => void)[] = [];
  let dismiss: (() => void) | null = null;
  let scope: FocusScope | null = null;

  afterNextRender(() => {
    showInTopLayer(element);
    const anchor = config.anchor();
    if (anchor) cleanups.push(floating.position(anchor));
    if (config.modal?.()) cleanups.push(hideOthers(element));
    // Registered as a layer before focus moves in, so outer layers see the focus as nested.
    mounted.set(true);
    if (config.dismiss && config.open()) {
      dismiss = createDismissable(element, config.dismiss);
    }
    if (config.focus) scope = createFocusScope(element, config.focus);
  });

  // The close starts: ask whether focus should return while outputs can still emit.
  effect(() => {
    if (mounted() && !config.open()) scope?.closing();
  });

  if (config.dismiss) {
    const options = config.dismiss;
    effect(() => {
      const active = mounted() && config.open();
      if (active && !dismiss) dismiss = createDismissable(element, options);
      else if (!active && dismiss) {
        dismiss();
        dismiss = null;
      }
    });
  }

  inject(DestroyRef).onDestroy(() => {
    dismiss?.();
    scope?.destroy();
    cleanups.reverse().forEach((cleanup) => cleanup());
  });

  return { mounted: mounted.asReadonly() };
}
