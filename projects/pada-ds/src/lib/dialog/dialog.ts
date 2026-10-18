import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import {
  AutoFocusEvent,
  DismissEvent,
  DsDialog,
  DsDialogClose,
  DsDialogContent,
  DsDialogDescription,
  DsDialogTitle,
  DsDialogTrigger,
  DsPresence,
} from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

export type DialogSize = 'auto' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * A modal dialog. Holds the open state; put the trigger and `ds-dialog-content` inside.
 *
 * ```html
 * <ds-dialog [(open)]="editing">
 *   <button dsButton dsDialogTrigger>Edit profile</button>
 *   <ds-dialog-content size="sm">
 *     <ds-dialog-header>
 *       <ds-dialog-title>Edit profile</ds-dialog-title>
 *       <ds-dialog-description>Changes save automatically.</ds-dialog-description>
 *     </ds-dialog-header>
 *     <ds-dialog-body>…</ds-dialog-body>
 *     <ds-dialog-footer>
 *       <button dsButton variant="secondary" dsDialogClose>Cancel</button>
 *       <button dsButton (click)="save()">Save</button>
 *     </ds-dialog-footer>
 *     <ds-dialog-close-button />
 *   </ds-dialog-content>
 * </ds-dialog>
 * ```
 */
@Component({
  selector: 'ds-dialog',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsDialog, inputs: ['open', 'modal'], outputs: ['openChange'] }],
  styles: ':host { display: contents; }',
})
export class DialogComponent {}

/**
 * The dialog panel, on a native `<dialog>` in the top layer with a `::backdrop`. Animates in and
 * out and respects reduced motion. Restyle it through `--pada-dialog-*` tokens on the element or
 * a parent.
 */
@Component({
  selector: 'ds-dialog-content',
  imports: [DsPresence, DsDialogContent],
  template: `
    <dialog
      *dsPresence="dialog.open()"
      dsDialogContent
      class="dialog"
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
  styleUrl: './dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogContentComponent {
  protected readonly dialog = inject(DsDialog);
  /** Width: auto (fits the content), sm 24rem, md 32rem, lg 44rem, xl 56rem, full. @default 'md' */
  readonly size = input<DialogSize>('md');
  /** Accessible name, when the dialog has no `ds-dialog-title`. */
  readonly ariaLabel = input<string>();
  /** Focus is about to move in. Prevent it to focus something else yourself. */
  readonly openAutoFocus = output<AutoFocusEvent>();
  /** Focus is about to return to the trigger. Prevent it to focus something else yourself. */
  readonly closeAutoFocus = output<AutoFocusEvent>();
  /** Escape was pressed. Prevent it to keep the dialog open. */
  readonly escapeKeyDown = output<DismissEvent<KeyboardEvent>>();
  /** A pointer went down outside (on the backdrop). Prevent it to keep the dialog open. */
  readonly pointerDownOutside = output<DismissEvent<PointerEvent>>();
  /** Any interaction outside. Prevent it to keep the dialog open. */
  readonly interactOutside = output<DismissEvent<PointerEvent | FocusEvent>>();
}

/** Top section: the title, description and close button. */
@Component({
  selector: 'ds-dialog-header',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--pada-space-1);
      padding-inline-end: var(--pada-space-8);
    }
  `,
})
export class DialogHeaderComponent {}

/** The dialog's accessible name, styled as its heading. */
@Component({
  selector: 'ds-dialog-title',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DsDialogTitle],
  host: { role: 'heading', '[attr.aria-level]': 'level()' },
  styles: `
    :host {
      display: block;
      margin: 0;
      font-size: var(--pada-font-size-lg);
      font-weight: var(--pada-font-weight-semibold);
      line-height: var(--pada-line-height-sm);
      color: var(--pada-color-fg);
    }
  `,
})
export class DialogTitleComponent {
  /** Heading level announced to assistive technology. @default 2 */
  readonly level = input(2);
}

/** Supporting text under the title, announced after it. */
@Component({
  selector: 'ds-dialog-description',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DsDialogDescription],
  styles: `
    :host {
      display: block;
      margin: 0;
      color: var(--pada-color-fg-muted);
    }
  `,
})
export class DialogDescriptionComponent {}

/** Scrollable main content. */
@Component({
  selector: 'ds-dialog-body',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      flex: 1;
      min-height: 0;
      overflow: auto;
    }
  `,
})
export class DialogBodyComponent {}

/** Bottom section for actions. Defaults to right-aligned buttons. */
@Component({
  selector: 'ds-dialog-footer',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-justify]': 'justify()' },
  styles: `
    :host {
      --pada-dialog-footer-justify: flex-end;
      display: flex;
      flex-wrap: wrap;
      gap: var(--pada-space-2);
      justify-content: var(--pada-dialog-footer-justify);
    }

    :host([data-justify='start']) {
      --pada-dialog-footer-justify: flex-start;
    }

    :host([data-justify='between']) {
      --pada-dialog-footer-justify: space-between;
    }
  `,
})
export class DialogFooterComponent {
  /** Main axis alignment of the actions. @default 'end' */
  readonly justify = input<'start' | 'end' | 'between'>('end');
}

/** Icon button in the top corner that closes the dialog. */
@Component({
  selector: 'ds-dialog-close-button',
  imports: [DsDialogClose, IconComponent],
  template: `
    <button dsDialogClose class="dialog-close" [attr.aria-label]="label()">
      <ds-icon name="cross_1" [size]="16" />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: contents;
    }

    .dialog-close {
      position: absolute;
      top: var(--pada-space-4);
      right: var(--pada-space-4);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--pada-control-height-md);
      height: var(--pada-control-height-md);
      padding: 0;
      border: none;
      border-radius: var(--pada-radius-lg);
      background: transparent;
      color: var(--pada-color-fg-muted);
      cursor: pointer;
      transition:
        background-color var(--pada-duration-fast) var(--pada-ease-standard),
        color var(--pada-duration-fast) var(--pada-ease-standard);
    }

    .dialog-close:hover {
      background-color: var(--pada-color-neutral-subtle-hover);
      color: var(--pada-color-fg);
    }

    .dialog-close:focus-visible {
      outline: none;
      box-shadow: var(--pada-shadow-focus);
    }
  `,
})
export class DialogCloseButtonComponent {
  /** Accessible name of the icon button. @default 'Close' */
  readonly label = input('Close');
}

/** Every dialog part, including the headless trigger and close directives. */
export const DialogParts = [
  DialogComponent,
  DialogContentComponent,
  DialogHeaderComponent,
  DialogTitleComponent,
  DialogDescriptionComponent,
  DialogBodyComponent,
  DialogFooterComponent,
  DialogCloseButtonComponent,
  DsDialogTrigger,
  DsDialogClose,
] as const;

export { DsDialogTrigger, DsDialogClose };
