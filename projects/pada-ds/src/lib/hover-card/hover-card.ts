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
  DismissEvent,
  DsFloatingArrow,
  DsHoverCard,
  DsHoverCardContent,
  DsHoverCardTrigger,
  DsPresence,
  Side,
} from 'pada-ds-angular/headless';

/**
 * A rich preview shown when people hover or focus a link: a profile, a page, a repository.
 * Opens after `openDelay` and stays open while the pointer or focus is on the card; closes
 * `closeDelay` after they leave, on Escape and on a pointer-down outside.
 *
 * The card is supplementary: what it shows must also be reachable through the link itself,
 * since touch and screen-reader users may never see it.
 *
 * ```html
 * <ds-hover-card [openDelay]="500">
 *   <a href="/people/ada" dsHoverCardTrigger>&#64;ada</a>
 *   <ds-hover-card-content side="bottom" align="start">
 *     Ada Lovelace, Engineering
 *     <ds-hover-card-arrow />
 *   </ds-hover-card-content>
 * </ds-hover-card>
 * ```
 *
 * Differences from React: the trigger is any element marked `dsHoverCardTrigger` (React wraps
 * its only child with `asChild`), so there is no `content` / `arrow` shorthand; compose
 * `ds-hover-card-content` and `ds-hover-card-arrow`. The card stays in place in the DOM and
 * joins the top layer instead of rendering in a portal.
 */
@Component({
  selector: 'ds-hover-card',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: DsHoverCard,
      inputs: ['open', 'openDelay', 'closeDelay'],
      outputs: ['openChange'],
    },
  ],
  styles: ':host { display: contents; }',
})
export class HoverCardComponent {}

/** The card, in the top layer, scaling in from the side that faces the trigger. */
@Component({
  selector: 'ds-hover-card-content',
  imports: [DsPresence, DsHoverCardContent],
  template: `
    <div
      *dsPresence="hoverCard.open()"
      dsHoverCardContent
      class="hover-card"
      [side]="side()"
      [align]="align()"
      [sideOffset]="sideOffset()"
      [alignOffset]="alignOffset()"
      [avoidCollisions]="avoidCollisions()"
      [collisionPadding]="collisionPadding()"
      [arrowPadding]="arrowPadding()"
      [hideWhenDetached]="hideWhenDetached()"
      (escapeKeyDown)="escapeKeyDown.emit($event)"
    >
      <ng-content />
    </div>
  `,
  styleUrl: './hover-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoverCardContentComponent {
  protected readonly hoverCard = inject(DsHoverCard);
  /** Preferred side of the trigger; flips when there is no room. @default 'bottom' */
  readonly side = input<Side>('bottom');
  /** Alignment along the side. @default 'center' */
  readonly align = input<Align>('center');
  /** Gap from the trigger, in px. @default 8 */
  readonly sideOffset = input(8, { transform: numberAttribute });
  /** Shift along the alignment axis, in px. @default 0 */
  readonly alignOffset = input(0, { transform: numberAttribute });
  /** Flip and shift to stay in the viewport. @default true */
  readonly avoidCollisions = input(true, { transform: booleanAttribute });
  /** Distance to keep from the viewport edges, in px. @default 8 */
  readonly collisionPadding = input(8, { transform: numberAttribute });
  /** Keeps the arrow this far from the corners, in px. @default 12 */
  readonly arrowPadding = input(12, { transform: numberAttribute });
  /** Hide the card when its trigger scrolls out of view. @default false */
  readonly hideWhenDetached = input(false, { transform: booleanAttribute });
  /** Escape was pressed. Prevent it to keep the card open. */
  readonly escapeKeyDown = output<DismissEvent<KeyboardEvent>>();
}

/** Arrow pointing at the trigger. Put it inside `ds-hover-card-content`. */
@Component({
  selector: 'ds-hover-card-arrow',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DsFloatingArrow],
  styles: `
    :host {
      width: 12px;
      height: 6px;
      background-color: var(--pada-hover-card-bg);
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
export class HoverCardArrowComponent {}

/** Every hover card part, including the headless trigger directive. */
export const HoverCardParts = [
  HoverCardComponent,
  HoverCardContentComponent,
  HoverCardArrowComponent,
  DsHoverCardTrigger,
] as const;

export { DsHoverCardTrigger };
