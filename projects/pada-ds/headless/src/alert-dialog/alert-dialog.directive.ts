import { DestroyRef, Directive, ElementRef, inject, output } from '@angular/core';
import { DsDialog, DsDialogClose, DsDialogContent } from '../dialog/dialog.directive';
import { injectButtonType } from '../utils/button';
import { focusElement } from '../utils/dom';
import { AutoFocusEvent } from '../utils/focus-scope';

/**
 * The panel of an alert dialog: a confirmation that needs an answer before the user continues
 * (WAI-ARIA APG: Alert Dialog). It is a `dsDialogContent` (use it on a `<dialog>` inside a
 * `dsDialog` root, with `dsDialogTitle` and `dsDialogDescription`) with three differences:
 * `role="alertdialog"`, a pointer-down outside never closes it (the user has to choose), and
 * focus starts on the `dsAlertDialogCancel` button, the least destructive choice.
 *
 * ```html
 * <ng-container dsDialog [(open)]="confirming">
 *   <button dsDialogTrigger>Delete project</button>
 *   <dialog *dsPresence="confirming()" dsAlertDialogContent>
 *     <h2 dsDialogTitle>Delete this project?</h2>
 *     <p dsDialogDescription>This cannot be undone.</p>
 *     <button dsAlertDialogCancel>Cancel</button>
 *     <button dsAlertDialogAction (click)="remove()">Delete</button>
 *   </dialog>
 * </ng-container>
 * ```
 */
@Directive({
  selector: '[dsAlertDialogContent]',
  hostDirectives: [{ directive: DsDialogContent, outputs: ['closeAutoFocus', 'escapeKeyDown'] }],
  host: { '[attr.role]': '"alertdialog"' },
})
export class DsAlertDialogContent {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /**
   * Focus is about to move in. By default it lands on the `dsAlertDialogCancel` button; prevent
   * it to focus something else yourself.
   */
  readonly openAutoFocus = output<AutoFocusEvent>();

  constructor() {
    const content = inject(DsDialogContent);
    const subscriptions = [
      content.openAutoFocus.subscribe((event) => {
        this.openAutoFocus.emit(event);
        if (event.defaultPrevented) return;
        const cancel = this.element.querySelector<HTMLElement>('[data-alert-dialog-cancel]');
        if (cancel) {
          event.preventDefault();
          focusElement(cancel);
        }
      }),
      // The user has to choose: clicks on the backdrop or elsewhere never close it.
      content.pointerDownOutside.subscribe((event) => event.preventDefault()),
    ];
    inject(DestroyRef).onDestroy(() => subscriptions.forEach((sub) => sub.unsubscribe()));
  }
}

/** The safe choice. Closes the alert dialog and gets the initial focus. */
@Directive({
  selector: '[dsAlertDialogCancel]',
  hostDirectives: [DsDialogClose],
  host: { 'data-alert-dialog-cancel': '' },
})
export class DsAlertDialogCancel {}

/**
 * The confirming action. Closes the alert dialog after your `(click)` handler runs; call
 * `preventDefault()` on the click to keep it open (for an async action, say).
 */
@Directive({ selector: '[dsAlertDialogAction]', host: { '(click)': 'onClick($event)' } })
export class DsAlertDialogAction {
  private readonly dialog = inject(DsDialog);
  private readonly element = injectButtonType();

  protected onClick(event: Event) {
    if (event.defaultPrevented) return;
    // Host listeners run before the consumer's (click), so the decision waits until the click
    // has bubbled to the document (or, if propagation was stopped, until the next task).
    const doc = this.element.ownerDocument;
    const finish = () => {
      doc.removeEventListener('click', onDocumentClick);
      clearTimeout(timer);
      if (!event.defaultPrevented) this.dialog.setOpen(false);
    };
    const onDocumentClick = (bubbled: Event) => bubbled === event && finish();
    doc.addEventListener('click', onDocumentClick);
    const timer = setTimeout(finish, 0);
  }
}

/** The alert dialog parts, for `imports: [DsAlertDialogParts]`; use them with `DsDialogParts`. */
export const DsAlertDialogParts = [
  DsAlertDialogContent,
  DsAlertDialogCancel,
  DsAlertDialogAction,
] as const;
