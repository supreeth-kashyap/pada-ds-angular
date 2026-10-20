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
  createTooltipDelays,
  DismissEvent,
  DS_TOOLTIP_DELAYS,
  DsFloatingArrow,
  DsPresence,
  DsTooltip,
  DsTooltipContent,
  DsTooltipProvider,
  DsTooltipTrigger,
  Side,
} from 'pada-ds-angular/headless';

/** Styled tooltips outside a provider open after 300ms, like React's `<Tooltip>`. */
const styledDelays = createTooltipDelays(
  () => 300,
  () => 300,
);

/**
 * Shares open delays between the tooltips inside it: moving from one trigger to the next soon
 * after skips the delay. Optional; put it once near the root of the app or around a toolbar.
 *
 * ```html
 * <ds-tooltip-provider [delayDuration]="500">…</ds-tooltip-provider>
 * ```
 */
@Component({
  selector: 'ds-tooltip-provider',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: DsTooltipProvider, inputs: ['delayDuration', 'skipDelayDuration'] },
  ],
  styles: ':host { display: contents; }',
})
export class TooltipProviderComponent {}

/**
 * A short description of an element, shown on hover (after `delayDuration`) and immediately on
 * keyboard focus. Closes on pointer leave, blur, pointer-down and Escape. The trigger gets
 * `aria-describedby` pointing at the tooltip only while it is open, keeping any ids it already
 * had. Never put interactive content in a tooltip.
 *
 * ```html
 * <ds-tooltip>
 *   <button dsButton variant="ghost" dsTooltipTrigger aria-label="Archive">…</button>
 *   <ds-tooltip-content side="bottom">Archive this record</ds-tooltip-content>
 * </ds-tooltip>
 * ```
 *
 * Differences from React: the trigger is any focusable element marked `dsTooltipTrigger` (React
 * wraps its only child with `asChild`), so there is no `content` / `position` shorthand; use
 * `ds-tooltip-content` and its `side` input. The content stays in place in the DOM and joins the
 * top layer instead of rendering in a portal. Without an explicit `delayDuration` the tooltip
 * follows the nearest `ds-tooltip-provider` and otherwise opens after 300ms.
 */
@Component({
  selector: 'ds-tooltip',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: DsTooltip,
      inputs: ['open', 'delayDuration', 'disableHoverableContent'],
      outputs: ['openChange'],
    },
  ],
  providers: [
    {
      provide: DS_TOOLTIP_DELAYS,
      useFactory: () =>
        inject(DS_TOOLTIP_DELAYS, { optional: true, skipSelf: true }) ?? styledDelays,
    },
  ],
  styles: ':host { display: contents; }',
})
export class TooltipComponent {}

/** The tooltip bubble, in the top layer, sliding in from the side that faces its trigger. */
@Component({
  selector: 'ds-tooltip-content',
  imports: [DsPresence, DsTooltipContent],
  template: `
    <div
      *dsPresence="tooltip.open()"
      dsTooltipContent
      class="tooltip"
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
  styleUrl: './tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipContentComponent {
  protected readonly tooltip = inject(DsTooltip);
  /** Preferred side of the trigger; flips when there is no room. @default 'top' */
  readonly side = input<Side>('top');
  /** Alignment along the side. @default 'center' */
  readonly align = input<Align>('center');
  /** Gap from the trigger, in px. @default 6 */
  readonly sideOffset = input(6, { transform: numberAttribute });
  /** Shift along the alignment axis, in px. @default 0 */
  readonly alignOffset = input(0, { transform: numberAttribute });
  /** Flip and shift to stay in the viewport. @default true */
  readonly avoidCollisions = input(true, { transform: booleanAttribute });
  /** Distance to keep from the viewport edges, in px. @default 8 */
  readonly collisionPadding = input(8, { transform: numberAttribute });
  /** Keeps the arrow this far from the corners, in px. @default 8 */
  readonly arrowPadding = input(8, { transform: numberAttribute });
  /** Hide the tooltip when its trigger scrolls out of view. @default false */
  readonly hideWhenDetached = input(false, { transform: booleanAttribute });
  /** Escape was pressed. Prevent it to keep the tooltip open. */
  readonly escapeKeyDown = output<DismissEvent<KeyboardEvent>>();
}

/** Arrow pointing at the trigger. Put it inside `ds-tooltip-content`. */
@Component({
  selector: 'ds-tooltip-arrow',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DsFloatingArrow],
  styles: `
    :host {
      width: 10px;
      height: 5px;
      background-color: var(--pada-tooltip-bg);
    }

    :host([data-side='top']) {
      translate: 0 100%;
      clip-path: polygon(0 0, 100% 0, 50% 100%);
    }

    :host([data-side='bottom']) {
      translate: 0 -100%;
      clip-path: polygon(50% 0, 100% 100%, 0 100%);
    }

    :host([data-side='left']) {
      width: 5px;
      height: 10px;
      translate: 100% 0;
      clip-path: polygon(0 0, 100% 50%, 0 100%);
    }

    :host([data-side='right']) {
      width: 5px;
      height: 10px;
      translate: -100% 0;
      clip-path: polygon(100% 0, 100% 100%, 0 50%);
    }
  `,
})
export class TooltipArrowComponent {}

/** Every tooltip part, including the headless trigger directive. */
export const TooltipParts = [
  TooltipProviderComponent,
  TooltipComponent,
  TooltipContentComponent,
  TooltipArrowComponent,
  DsTooltipTrigger,
] as const;

export { DsTooltipTrigger };
