import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import {
  AutoFocusEvent,
  DismissEvent,
  DsAlertDialogAction,
  DsAlertDialogCancel,
  DsAlertDialogContent,
  DsDialog,
  DsDialogTrigger,
  DsPresence,
} from 'pada-ds-angular/headless';
import {
  DialogDescriptionComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
  DialogSize,
  DialogTitleComponent,
} from '../dialog/dialog';

/**
 * A confirmation that needs an answer before the user continues (WAI-ARIA APG: Alert Dialog).
 * Holds the open state; put the trigger and `ds-alert-dialog-content` inside. The panel is
 * `role="alertdialog"`, a click outside does not close it (the user has to choose; Escape still
 * does), and focus starts on the Cancel button, the least destructive choice.
 *
 * ```html
 * <ds-alert-dialog>
 *   <button dsButton variant="destructive" dsDialogTrigger>Delete project</button>
 *   <ds-alert-dialog-content>
 *     <ds-dialog-header>
 *       <ds-dialog-title>Delete this project?</ds-dialog-title>
 *       <ds-dialog-description>This cannot be undone.</ds-dialog-description>
 *     </ds-dialog-header>
 *     <ds-dialog-footer>
 *       <button dsButton variant="secondary" dsAlertDialogCancel>Cancel</button>
 *       <button dsButton variant="destructive" dsAlertDialogAction (click)="remove()">Delete</button>
 *     </ds-dialog-footer>
 *   </ds-alert-dialog-content>
 * </ds-alert-dialog>
 * ```
 *
 * Differences from React: Cancel and Action are directives for a `dsButton` (React renders a
 * `Button` with the secondary / primary variant), so set the variant on the button. The header,
 * title, description and footer are the Dialog parts. The panel is a native `<dialog>` opened
 * with `showModal()`, so its backdrop is `::backdrop` rather than an overlay element.
 */
@Component({
  selector: 'ds-alert-dialog',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsDialog, inputs: ['open'], outputs: ['openChange'] }],
  styles: ':host { display: contents; }',
})
export class AlertDialogComponent {}

/** The confirmation panel, on a native `<dialog>` with the Dialog look. */
@Component({
  selector: 'ds-alert-dialog-content',
  imports: [DsPresence, DsAlertDialogContent],
  template: `
    <dialog
      *dsPresence="dialog.open()"
      dsAlertDialogContent
      class="dialog"
      [attr.data-size]="size()"
      [attr.aria-label]="ariaLabel() || null"
      (openAutoFocus)="openAutoFocus.emit($event)"
      (closeAutoFocus)="closeAutoFocus.emit($event)"
      (escapeKeyDown)="escapeKeyDown.emit($event)"
    >
      <ng-content />
    </dialog>
  `,
  styleUrl: '../dialog/dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertDialogContentComponent {
  protected readonly dialog = inject(DsDialog);
  /** Width: auto, sm 24rem, md 32rem, lg 44rem, xl 56rem, full. @default 'sm' */
  readonly size = input<DialogSize>('sm');
  /** Accessible name, when the alert dialog has no `ds-dialog-title`. */
  readonly ariaLabel = input<string>();
  /** Focus is about to move in (to Cancel by default). Prevent it to focus something else. */
  readonly openAutoFocus = output<AutoFocusEvent>();
  /** Focus is about to return to the trigger. Prevent it to focus something else yourself. */
  readonly closeAutoFocus = output<AutoFocusEvent>();
  /** Escape was pressed. Prevent it to keep the alert dialog open. */
  readonly escapeKeyDown = output<DismissEvent<KeyboardEvent>>();
}

/** Every alert dialog part, with the Dialog header, title, description and footer. */
export const AlertDialogParts = [
  AlertDialogComponent,
  AlertDialogContentComponent,
  DialogHeaderComponent,
  DialogTitleComponent,
  DialogDescriptionComponent,
  DialogFooterComponent,
  DsDialogTrigger,
  DsAlertDialogCancel,
  DsAlertDialogAction,
] as const;

export { DsAlertDialogCancel, DsAlertDialogAction };
