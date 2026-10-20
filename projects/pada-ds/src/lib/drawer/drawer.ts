import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import {
  AutoFocusEvent,
  DismissEvent,
  DsDialog,
  DsDialogClose,
  DsDialogContent,
  DsDialogTrigger,
  DsPresence,
} from 'pada-ds-angular/headless';
import {
  DialogBodyComponent,
  DialogCloseButtonComponent,
  DialogDescriptionComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
  DialogTitleComponent,
} from '../dialog/dialog';

export type DrawerSide = 'left' | 'right' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * A panel that slides in from an edge of the screen. A modal dialog underneath: it traps focus,
 * closes on Escape and on a click on the backdrop, and returns focus to its trigger. Holds the
 * open state; put the trigger and `ds-drawer-content` inside, and the Dialog parts inside that.
 *
 * ```html
 * <ds-drawer [(open)]="filtersOpen">
 *   <button dsButton dsDialogTrigger>Filters</button>
 *   <ds-drawer-content side="right" size="md">
 *     <ds-dialog-header><ds-dialog-title>Filters</ds-dialog-title></ds-dialog-header>
 *     <ds-dialog-body>…</ds-dialog-body>
 *     <ds-dialog-close-button />
 *   </ds-drawer-content>
 * </ds-drawer>
 * ```
 *
 * Differences from React: the panel is a native `<dialog>` opened with `showModal()` and stays in
 * place in the DOM, so the backdrop is its `::backdrop` rather than an overlay element in a
 * portal.
 */
@Component({
  selector: 'ds-drawer',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsDialog, inputs: ['open'], outputs: ['openChange'] }],
  styles: ':host { display: contents; }',
})
export class DrawerComponent {}

/** The sliding panel, on a native `<dialog>` in the top layer with a `::backdrop`. */
@Component({
  selector: 'ds-drawer-content',
  imports: [DsPresence, DsDialogContent],
  template: `
    <dialog
      *dsPresence="dialog.open()"
      dsDialogContent
      class="drawer"
      [attr.data-side]="side()"
      [attr.data-size]="size()"
      [attr.aria-label]="ariaLabel() || null"
      (openAutoFocus)="openAutoFocus.emit($event)"
      (closeAutoFocus)="closeAutoFocus.emit($event)"
      (escapeKeyDown)="escapeKeyDown.emit($event)"
      (pointerDownOutside)="pointerDownOutside.emit($event)"
      (interactOutside)="interactOutside.emit($event)"
    >
      <ng-content />
    </dialog>
  `,
  styleUrl: './drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerContentComponent {
  protected readonly dialog = inject(DsDialog);
  /** Edge the drawer slides in from. @default 'right' */
  readonly side = input<DrawerSide>('right');
  /** Width (left/right) or height (top/bottom): sm 496px, md 640px, lg 800px, xl 960px. @default 'sm' */
  readonly size = input<DrawerSize>('sm');
  /** Accessible name, when the drawer has no `ds-dialog-title`. */
  readonly ariaLabel = input<string>();
  /** Focus is about to move in. Prevent it to focus something else yourself. */
  readonly openAutoFocus = output<AutoFocusEvent>();
  /** Focus is about to return to the trigger. Prevent it to focus something else yourself. */
  readonly closeAutoFocus = output<AutoFocusEvent>();
  /** Escape was pressed. Prevent it to keep the drawer open. */
  readonly escapeKeyDown = output<DismissEvent<KeyboardEvent>>();
  /** A pointer went down outside (on the backdrop). Prevent it to keep the drawer open. */
  readonly pointerDownOutside = output<DismissEvent<PointerEvent>>();
  /** Any interaction outside. Prevent it to keep the drawer open. */
  readonly interactOutside = output<DismissEvent<PointerEvent | FocusEvent>>();
}

/** Every drawer part, with the Dialog parts used inside it. */
export const DrawerParts = [
  DrawerComponent,
  DrawerContentComponent,
  DialogHeaderComponent,
  DialogTitleComponent,
  DialogDescriptionComponent,
  DialogBodyComponent,
  DialogFooterComponent,
  DialogCloseButtonComponent,
  DsDialogTrigger,
  DsDialogClose,
] as const;
