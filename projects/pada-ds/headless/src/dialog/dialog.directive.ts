import {
  afterNextRender,
  booleanAttribute,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { createDismissable, DismissEvent } from '../utils/dismissable';
import { isBrowser, openState, showInTopLayer } from '../utils/dom';
import { AutoFocusEvent, createFocusScope, FocusScope } from '../utils/focus-scope';
import { injectButtonType } from '../utils/button';
import { uniqueId } from '../utils/id';
import { hideOthers, lockScroll } from '../utils/modal';

/**
 * Holds the open state of a dialog. Put it on any element, or an `<ng-container>`, that wraps the
 * other parts. WAI-ARIA APG: Dialog (Modal).
 *
 * ```html
 * <ng-container dsDialog [(open)]="open">
 *   <button dsDialogTrigger>Edit profile</button>
 *   <dialog *dsPresence="open()" dsDialogContent class="panel">
 *     <h2 dsDialogTitle>Edit profile</h2>
 *     <p dsDialogDescription>Changes save automatically.</p>
 *     <button dsDialogClose>Done</button>
 *   </dialog>
 * </ng-container>
 * ```
 */
@Directive({ selector: '[dsDialog]', exportAs: 'dsDialog' })
export class DsDialog {
  /** Whether the dialog is open. Two-way bindable: `[(open)]`. */
  readonly open = model(false);
  /**
   * Modal dialogs make the rest of the page inert, trap focus and lock page scroll. Non-modal
   * dialogs do none of that and close when focus leaves them.
   */
  readonly modal = input(true, { transform: booleanAttribute });

  readonly contentId = uniqueId('ds-dialog-');
  readonly titleId = `${this.contentId}-title`;
  readonly descriptionId = `${this.contentId}-description`;
  /** Set while a title or description part is rendered, for the content's ARIA references. */
  readonly hasTitle = signal(false);
  readonly hasDescription = signal(false);
  /** The trigger element, if any. Clicks on it toggle the dialog rather than dismissing it. */
  readonly trigger = signal<HTMLElement | null>(null);

  setOpen(open: boolean) {
    this.open.set(open);
  }
}

/** Opens the dialog. Gets `aria-haspopup`, `aria-expanded`, `aria-controls` and `data-state`. */
@Directive({
  selector: '[dsDialogTrigger]',
  host: {
    'aria-haspopup': 'dialog',
    '[attr.aria-expanded]': 'dialog.open()',
    '[attr.aria-controls]': 'dialog.open() ? dialog.contentId : null',
    '[attr.data-state]': 'state()',
    '(click)': 'toggle($event)',
  },
})
export class DsDialogTrigger implements OnInit, OnDestroy {
  protected readonly dialog = inject(DsDialog);
  private readonly element = injectButtonType();
  protected readonly state = () => openState(this.dialog.open());

  ngOnInit() {
    this.dialog.trigger.set(this.element);
  }

  ngOnDestroy() {
    if (this.dialog.trigger() === this.element) this.dialog.trigger.set(null);
  }

  protected toggle(event: Event) {
    if (!event.defaultPrevented) this.dialog.setOpen(!this.dialog.open());
  }
}

/**
 * The dialog panel. Use it on a `<dialog>` element: modal dialogs then open with `showModal()`,
 * so the browser makes the rest of the page inert and draws the `::backdrop`. On any other
 * element it gets `role="dialog"`, joins the top layer and hides the rest of the page from
 * assistive technology itself.
 *
 * Render it with `*dsPresence="dialog.open()"` so it can animate out: it gets
 * `data-state="closed"` before it is removed.
 */
@Directive({
  selector: '[dsDialogContent]',
  host: {
    '[id]': 'dialog.contentId',
    '[attr.role]': 'isNativeDialog ? null : "dialog"',
    '[attr.aria-modal]': 'dialog.modal() ? "true" : null',
    '[attr.aria-labelledby]': 'dialog.hasTitle() ? dialog.titleId : null',
    '[attr.aria-describedby]': 'dialog.hasDescription() ? dialog.descriptionId : null',
    '[attr.data-state]': 'state()',
    tabindex: '-1',
    'data-pada-layer': '',
    '(cancel)': '$event.preventDefault()',
    '(close)': 'onNativeClose()',
  },
})
export class DsDialogContent {
  protected readonly dialog = inject(DsDialog);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly isNativeDialog = this.element.tagName === 'DIALOG';
  protected readonly state = () => openState(this.dialog.open());

  /** Focus is about to move into the dialog. Prevent it to focus something else yourself. */
  readonly openAutoFocus = output<AutoFocusEvent>();
  /** Focus is about to return to the trigger. Prevent it to focus something else yourself. */
  readonly closeAutoFocus = output<AutoFocusEvent>();
  /** Escape was pressed. Prevent it to keep the dialog open. */
  readonly escapeKeyDown = output<DismissEvent<KeyboardEvent>>();
  /** A pointer went down outside the dialog. Prevent it to keep the dialog open. */
  readonly pointerDownOutside = output<DismissEvent<PointerEvent>>();
  /** Any interaction outside the dialog (pointer or focus). Prevent it to keep it open. */
  readonly interactOutside = output<DismissEvent<PointerEvent | FocusEvent>>();

  private readonly mounted = signal(false);

  constructor() {
    const cleanups: (() => void)[] = [];
    let dismiss: (() => void) | null = null;
    let scope: FocusScope | null = null;

    afterNextRender(() => {
      const element = this.element;
      const modal = this.dialog.modal();
      // showModal() moves focus itself, so note where it was first, to return it on close.
      const previouslyFocused = element.ownerDocument.activeElement;
      if (element instanceof HTMLDialogElement && typeof element.showModal === 'function') {
        if (!element.open) {
          if (modal) element.showModal();
          else element.show();
        }
      } else {
        showInTopLayer(element);
        if (modal) cleanups.push(hideOthers(element));
      }
      if (modal) cleanups.push(lockScroll(element.ownerDocument));
      // Registered as a layer before focus moves in, so outer layers see the focus as nested.
      this.mounted.set(true);
      scope = createFocusScope(
        element,
        () => ({
          trapped: this.dialog.modal() && this.dialog.open(),
          onMountAutoFocus: (event) => this.openAutoFocus.emit(event),
          onUnmountAutoFocus: (event) => this.closeAutoFocus.emit(event),
        }),
        previouslyFocused,
      );
    });

    // Escape and outside clicks only count while open, not during the exit animation.
    effect(() => {
      const active = this.mounted() && this.dialog.open();
      if (active && !dismiss) {
        dismiss = createDismissable(this.element, () => ({
          onDismiss: () => this.dialog.setOpen(false),
          onEscapeKeyDown: (event) => this.escapeKeyDown.emit(event),
          onPointerDownOutside: (event) => this.pointerDownOutside.emit(event),
          dismissOnFocusOutside: !this.dialog.modal(),
          onInteractOutside: (event) => {
            this.interactOutside.emit(event);
            // A click on the trigger toggles the dialog itself; do not also close it here.
            const trigger = this.dialog.trigger();
            if (event.target instanceof Node && trigger?.contains(event.target))
              event.preventDefault();
          },
        }));
      } else if (!active && dismiss) {
        dismiss();
        dismiss = null;
      }
      // The close starts: ask whether focus should return while outputs can still emit.
      if (this.mounted() && !this.dialog.open()) scope?.closing();
    });

    inject(DestroyRef).onDestroy(() => {
      dismiss?.();
      scope?.destroy();
      // Focus is restored after the element leaves the DOM (createFocusScope defers it).
      cleanups.reverse().forEach((cleanup) => cleanup());
      if (isBrowser() && this.element instanceof HTMLDialogElement && this.element.open)
        this.element.close?.();
    });
  }

  /** The browser closed a native dialog by itself (Escape pressed twice, `dialog.close()`). */
  protected onNativeClose() {
    if (this.dialog.open() && this.mounted()) this.dialog.setOpen(false);
  }
}

/** The dialog's accessible name. Every dialog needs one (visually hidden if necessary). */
@Directive({ selector: '[dsDialogTitle]', host: { '[id]': 'dialog.titleId' } })
export class DsDialogTitle implements OnInit, OnDestroy {
  protected readonly dialog = inject(DsDialog);
  ngOnInit() {
    this.dialog.hasTitle.set(true);
  }
  ngOnDestroy() {
    this.dialog.hasTitle.set(false);
  }
}

/** Optional description, announced after the title. */
@Directive({ selector: '[dsDialogDescription]', host: { '[id]': 'dialog.descriptionId' } })
export class DsDialogDescription implements OnInit, OnDestroy {
  protected readonly dialog = inject(DsDialog);
  ngOnInit() {
    this.dialog.hasDescription.set(true);
  }
  ngOnDestroy() {
    this.dialog.hasDescription.set(false);
  }
}

/** Closes the dialog. Give icon-only close buttons an `aria-label`. */
@Directive({ selector: '[dsDialogClose]', host: { '(click)': 'close($event)' } })
export class DsDialogClose {
  private readonly dialog = inject(DsDialog);
  constructor() {
    injectButtonType();
  }
  protected close(event: Event) {
    if (!event.defaultPrevented) this.dialog.setOpen(false);
  }
}

/** Every dialog part, for `imports: [DsDialogParts]`. */
export const DsDialogParts = [
  DsDialog,
  DsDialogTrigger,
  DsDialogContent,
  DsDialogTitle,
  DsDialogDescription,
  DsDialogClose,
] as const;
