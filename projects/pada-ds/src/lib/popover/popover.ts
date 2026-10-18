import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import {
  Align,
  AutoFocusEvent,
  DismissEvent,
  DsFloatingArrow,
  DsPopover,
  DsPopoverAnchor,
  DsPopoverClose,
  DsPopoverContent,
  DsPopoverTitle,
  DsPopoverTrigger,
  DsPresence,
  Side,
} from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

export type PopoverContentVariant = 'default' | 'dashed' | 'active';

/**
 * A non-modal dialog anchored to its trigger. Holds the open state.
 *
 * ```html
 * <ds-popover>
 *   <button dsButton variant="secondary" dsPopoverTrigger>Filters</button>
 *   <ds-popover-content align="start">
 *     <ds-popover-title>Filters</ds-popover-title>
 *     …
 *     <ds-popover-close-button />
 *   </ds-popover-content>
 * </ds-popover>
 * ```
 */
@Component({
  selector: 'ds-popover',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsPopover, inputs: ['open', 'modal'], outputs: ['openChange'] }],
  styles: ':host { display: contents; }',
})
export class PopoverComponent {}

/** The floating panel, in the top layer, animated from the side that faces its trigger. */
@Component({
  selector: 'ds-popover-content',
  imports: [DsPresence, DsPopoverContent],
  template: `
    <div
      *dsPresence="popover.open()"
      dsPopoverContent
      class="popover"
      [attr.data-variant]="variant()"
      [attr.aria-label]="ariaLabel() || null"
      [side]="side()"
      [align]="align()"
      [sideOffset]="sideOffset()"
      [alignOffset]="alignOffset()"
      [avoidCollisions]="avoidCollisions()"
      [collisionPadding]="collisionPadding()"
      [arrowPadding]="arrowPadding()"
      [hideWhenDetached]="hideWhenDetached()"
      (openAutoFocus)="openAutoFocus.emit($event)"
      (closeAutoFocus)="closeAutoFocus.emit($event)"
      (escapeKeyDown)="escapeKeyDown.emit($event)"
      (pointerDownOutside)="pointerDownOutside.emit($event)"
      (focusOutside)="focusOutside.emit($event)"
      (interactOutside)="interactOutside.emit($event)"
    >
      <ng-content />
    </div>
  `,
  styleUrl: './popover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopoverContentComponent {
  protected readonly popover = inject(DsPopover);
  /** Surface style: default (solid border), dashed, or active (accent border with a glow). */
  readonly variant = input<PopoverContentVariant>('default');
  /** Accessible name, when the popover has no `ds-popover-title`. */
  readonly ariaLabel = input<string>();
  /** Preferred side of the trigger; flips when there is no room. @default 'bottom' */
  readonly side = input<Side>('bottom');
  /** Alignment along the side. @default 'center' */
  readonly align = input<Align>('center');
  /** Gap from the trigger, in px. @default 8 */
  readonly sideOffset = input(8, { transform: numberAttribute });
  readonly alignOffset = input(0, { transform: numberAttribute });
  readonly avoidCollisions = input(true, { transform: booleanAttribute });
  readonly collisionPadding = input(8, { transform: numberAttribute });
  readonly arrowPadding = input(8, { transform: numberAttribute });
  readonly hideWhenDetached = input(false, { transform: booleanAttribute });
  readonly openAutoFocus = output<AutoFocusEvent>();
  readonly closeAutoFocus = output<AutoFocusEvent>();
  readonly escapeKeyDown = output<DismissEvent<KeyboardEvent>>();
  readonly pointerDownOutside = output<DismissEvent<PointerEvent>>();
  readonly focusOutside = output<DismissEvent<FocusEvent>>();
  readonly interactOutside = output<DismissEvent<PointerEvent | FocusEvent>>();
}

/** The popover's heading; names the popover for assistive technology. */
@Component({
  selector: 'ds-popover-title',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DsPopoverTitle],
  host: { role: 'heading', '[attr.aria-level]': 'level()' },
  styles: `
    :host {
      display: block;
      margin: 0 0 var(--pada-space-3);
      padding-inline-end: var(--pada-space-6);
      font-size: var(--pada-font-size-md);
      font-weight: var(--pada-font-weight-semibold);
      line-height: var(--pada-line-height-md);
      color: var(--pada-popover-title-color);
    }
  `,
})
export class PopoverTitleComponent {
  /** Heading level announced to assistive technology. @default 2 */
  readonly level = input(2);
}

/** Arrow pointing at the trigger. */
@Component({
  selector: 'ds-popover-arrow',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DsFloatingArrow],
  styles: `
    :host {
      width: 12px;
      height: 6px;
      background-color: var(--pada-popover-bg);
    }

    :host([data-side='bottom']) {
      translate: 0 -100%;
      clip-path: polygon(50% 0, 100% 100%, 0 100%);
    }

    :host([data-side='top']) {
      translate: 0 100%;
      clip-path: polygon(0 0, 100% 0, 50% 100%);
    }

    :host([data-side='left']) {
      width: 6px;
      height: 12px;
      translate: 100% 0;
      clip-path: polygon(0 0, 100% 50%, 0 100%);
    }

    :host([data-side='right']) {
      width: 6px;
      height: 12px;
      translate: -100% 0;
      clip-path: polygon(100% 0, 100% 100%, 0 50%);
    }
  `,
})
export class PopoverArrowComponent {}

/** Icon button in the top corner that closes the popover. */
@Component({
  selector: 'ds-popover-close-button',
  imports: [DsPopoverClose, IconComponent],
  template: `
    <button dsPopoverClose class="popover-close" [attr.aria-label]="label()">
      <ds-icon name="cross_1" [size]="14" />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: contents;
    }

    .popover-close {
      position: absolute;
      top: var(--pada-space-2);
      right: var(--pada-space-2);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--pada-space-6);
      height: var(--pada-space-6);
      padding: 0;
      border: none;
      border-radius: var(--pada-radius-md);
      background: transparent;
      color: var(--pada-color-fg-muted);
      cursor: pointer;
      transition:
        background-color var(--pada-duration-fast) var(--pada-ease-standard),
        color var(--pada-duration-fast) var(--pada-ease-standard);
    }

    .popover-close:hover {
      background-color: var(--pada-color-neutral-subtle-hover);
      color: var(--pada-color-fg);
    }

    .popover-close:focus-visible {
      outline: none;
      box-shadow: var(--pada-shadow-focus);
    }
  `,
})
export class PopoverCloseButtonComponent {
  /** Accessible name of the icon button. @default 'Close' */
  readonly label = input('Close');
}

/** Every popover part, including the headless trigger, anchor and close directives. */
export const PopoverParts = [
  PopoverComponent,
  PopoverContentComponent,
  PopoverTitleComponent,
  PopoverArrowComponent,
  PopoverCloseButtonComponent,
  DsPopoverTrigger,
  DsPopoverAnchor,
  DsPopoverClose,
] as const;

export { DsPopoverTrigger, DsPopoverAnchor, DsPopoverClose };
