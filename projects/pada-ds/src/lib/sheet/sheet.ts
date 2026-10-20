import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import {
  AutoFocusEvent,
  dataFlag,
  DismissEvent,
  DsDialog,
  DsDialogClose,
  DsDialogContent,
  DsDialogTrigger,
  DsPresence,
  isBrowser,
} from 'pada-ds-angular/headless';
import {
  DialogBodyComponent,
  DialogCloseButtonComponent,
  DialogDescriptionComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
  DialogTitleComponent,
} from '../dialog/dialog';

/** Moving less than this many pixels is a click, not a drag. */
const DRAG_THRESHOLD = 4;
/** A release faster than this (px/ms) counts as a flick in its direction. */
const FLICK_VELOCITY = 0.5;
/** Release velocity is measured over the last this many milliseconds of the drag. */
const VELOCITY_WINDOW = 100;
/** Without snap points, dragging down more than this share of the height closes the sheet. */
const CLOSE_RATIO = 0.3;
/** Pointer-downs on these never start a drag, so controls keep working. */
const NO_DRAG =
  'input, textarea, select, button:not([data-sheet-grabber]), a[href], [contenteditable="true"], [role="slider"], [data-sheet-no-drag]';

const viewportHeight = () => (isBrowser() ? window.innerHeight || 1 : 1);

/**
 * A bottom sheet: a modal dialog that rises from the bottom edge, for mobile-first flows
 * (filters, a share menu, details). Drag it down to close, or between `snapPoints`; Escape and
 * a click on the backdrop close it too. Holds the open state; put the trigger and
 * `ds-sheet-content` inside, and the Dialog parts inside that.
 *
 * ```html
 * <ds-sheet>
 *   <button dsButton dsDialogTrigger>Share</button>
 *   <ds-sheet-content [snapPoints]="[0.5, 0.9]" [(snap)]="snap">
 *     <ds-dialog-header><ds-dialog-title>Share</ds-dialog-title></ds-dialog-header>
 *     <ds-dialog-body>…</ds-dialog-body>
 *   </ds-sheet-content>
 * </ds-sheet>
 * ```
 *
 * Differences from React: the panel is a native `<dialog>` opened with `showModal()` and stays in
 * place in the DOM (its backdrop is `::backdrop`, not an overlay element in a portal). `snap` is
 * one two-way input: leave it unset to start at the first snap point (React's `defaultSnap`).
 */
@Component({
  selector: 'ds-sheet',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsDialog, inputs: ['open'], outputs: ['openChange'] }],
  styles: ':host { display: contents; }',
})
export class SheetComponent {}

/**
 * The sheet panel, on a native `<dialog>`. Follows a drag from anywhere on it except controls
 * (inputs, buttons, links, sliders, `[data-sheet-no-drag]`) and content scrolled away from its
 * top. With snap points it shows a grabber button that cycles through them.
 */
@Component({
  selector: 'ds-sheet-content',
  imports: [DsPresence, DsDialogContent],
  template: `
    <dialog
      *dsPresence="dialog.open()"
      dsDialogContent
      class="sheet"
      [attr.data-snap]="points() ? current() : null"
      [attr.data-dragging]="draggingFlag()"
      [attr.aria-label]="ariaLabel() || null"
      [style.--pada-sheet-drag]="dragOffset()"
      [style.--pada-sheet-offset]="restingOffsetPx()"
      [style.--pada-sheet-height]="height()"
      (pointerdown)="onPointerDown($event)"
      (openAutoFocus)="openAutoFocus.emit($event)"
      (closeAutoFocus)="closeAutoFocus.emit($event)"
      (escapeKeyDown)="escapeKeyDown.emit($event)"
      (pointerDownOutside)="pointerDownOutside.emit($event)"
      (interactOutside)="interactOutside.emit($event)"
    >
      @if (points()) {
        <button
          type="button"
          class="sheet-grabber"
          data-sheet-grabber
          [attr.aria-label]="atHighest() ? 'Collapse sheet' : 'Expand sheet'"
          (click)="cycle()"
        ></button>
      } @else {
        <span class="sheet-grabber" aria-hidden="true"></span>
      }
      <ng-content />
    </dialog>
  `,
  styleUrl: './sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SheetContentComponent {
  protected readonly dialog = inject(DsDialog);

  /**
   * Heights the sheet rests at, as fractions of the viewport height in ascending order, e.g.
   * `[0.4, 0.9]`. Without them the sheet fits its content (up to the maximum height).
   */
  readonly snapPoints = input<number[]>();
  /** The snap point the sheet rests at (one of `snapPoints`). Two-way bindable: `[(snap)]`. */
  readonly snap = model<number>();
  /** Close when dragged or flicked down past the lowest position. @default true */
  readonly dismissible = input(true, { transform: booleanAttribute });
  /** Accessible name, when the sheet has no `ds-dialog-title`. */
  readonly ariaLabel = input<string>();
  /** Focus is about to move in. Prevent it to focus something else yourself. */
  readonly openAutoFocus = output<AutoFocusEvent>();
  /** Focus is about to return to the trigger. Prevent it to focus something else yourself. */
  readonly closeAutoFocus = output<AutoFocusEvent>();
  /** Escape was pressed. Prevent it to keep the sheet open. */
  readonly escapeKeyDown = output<DismissEvent<KeyboardEvent>>();
  /** A pointer went down outside (on the backdrop). Prevent it to keep the sheet open. */
  readonly pointerDownOutside = output<DismissEvent<PointerEvent>>();
  /** Any interaction outside. Prevent it to keep the sheet open. */
  readonly interactOutside = output<DismissEvent<PointerEvent | FocusEvent>>();

  protected readonly points = computed(() => {
    const points = this.snapPoints();
    return points?.length ? points : undefined;
  });
  private readonly highest = computed(() => this.points()?.at(-1) ?? 1);
  /** The snap point in effect: the bound one, else the first. */
  protected readonly current = computed(() => this.snap() ?? this.points()?.[0] ?? 1);
  private readonly viewport = signal(viewportHeight());
  /** How far the sheet sits below its full height for the current snap point, in px. */
  private readonly restingOffset = computed(() =>
    this.points() ? (this.highest() - this.current()) * this.viewport() : 0,
  );
  private readonly drag = signal(0);
  private readonly dragging = signal(false);

  protected readonly restingOffsetPx = computed(() => `${this.restingOffset()}px`);
  protected readonly dragOffset = computed(() => `${this.drag()}px`);
  protected readonly height = computed(() => (this.points() ? `${this.highest() * 100}dvh` : null));
  protected readonly draggingFlag = computed(() => dataFlag(this.dragging()));
  protected readonly atHighest = computed(() => !this.points() || this.current() >= this.highest());

  /** A drag that starts on the grabber ends with a click on it; that click must not also cycle. */
  private suppressClick = false;
  private stopGesture: (() => void) | undefined;

  constructor() {
    if (isBrowser()) {
      const onResize = () => this.viewport.set(viewportHeight());
      window.addEventListener('resize', onResize);
      inject(DestroyRef).onDestroy(() => {
        window.removeEventListener('resize', onResize);
        this.stopGesture?.();
      });
    }
  }

  private setSnap(point: number) {
    if (point !== this.current()) this.snap.set(point);
  }

  private settle(moved: number, velocity: number, height: number) {
    this.drag.set(0);
    this.dragging.set(false);
    const points = this.points();
    const dismissible = this.dismissible();
    if (!points) {
      if (dismissible && (moved > height * CLOSE_RATIO || velocity > FLICK_VELOCITY))
        this.dialog.setOpen(false);
      return;
    }
    const snap = this.current();
    const visible = snap - moved / viewportHeight();
    let index = points.indexOf(snap);
    if (velocity > FLICK_VELOCITY) index -= 1;
    else if (velocity < -FLICK_VELOCITY) index += 1;
    else {
      // The nearest resting place, counting "closed" (0) when the sheet can be dismissed.
      const candidates = dismissible ? [0, ...points] : points;
      const nearest = candidates.reduce((best, point) =>
        Math.abs(point - visible) < Math.abs(best - visible) ? point : best,
      );
      index = nearest === 0 ? -1 : points.indexOf(nearest);
    }
    if (index < 0) {
      if (dismissible) this.dialog.setOpen(false);
      else this.setSnap(points[0]);
      return;
    }
    this.setSnap(points[Math.min(index, points.length - 1)]);
  }

  protected onPointerDown(event: PointerEvent) {
    const sheet = event.currentTarget as HTMLElement;
    if (event.button !== 0 || !(event.target instanceof Element)) return;
    if (event.target.closest(NO_DRAG)) return;
    // Content scrolled away from its top scrolls instead of dragging the sheet.
    for (
      let node: Element | null = event.target;
      node && node !== sheet;
      node = node.parentElement
    ) {
      if (node.scrollTop > 0) return;
    }
    this.startGesture(sheet, event.pointerId, event.clientY);
  }

  /**
   * The gesture is followed on the document from the first pointer-down, so moves that leave
   * the sheet before the drag threshold still count, without capturing the pointer (which would
   * turn a click on a label into a click on the sheet).
   */
  private startGesture(sheet: HTMLElement, pointerId: number, startY: number) {
    this.stopGesture?.();
    const doc = sheet.ownerDocument;
    let active = false;
    let samples = [{ y: startY, time: performance.now() }];
    // Upwards the sheet follows the pointer until the highest snap point, then resists.
    const room = this.restingOffset();

    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const moved = event.clientY - startY;
      if (!active) {
        if (Math.abs(moved) < DRAG_THRESHOLD) return;
        active = true;
        this.dragging.set(true);
      }
      const now = performance.now();
      samples = [
        ...samples.filter((sample) => now - sample.time <= VELOCITY_WINDOW),
        { y: event.clientY, time: now },
      ];
      this.drag.set(moved >= -room ? moved : -room + (moved + room) / 4);
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      stop();
      if (!active) return;
      this.suppressClick = true;
      setTimeout(() => (this.suppressClick = false), 0);
      const now = performance.now();
      const first =
        samples.find((sample) => now - sample.time <= VELOCITY_WINDOW) ??
        samples[samples.length - 1];
      const velocity = now > first.time ? (event.clientY - first.y) / (now - first.time) : 0;
      this.settle(event.clientY - startY, velocity, sheet.getBoundingClientRect().height);
    };
    const cancel = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      stop();
      this.drag.set(0);
      this.dragging.set(false);
    };
    const stop = () => {
      doc.removeEventListener('pointermove', move);
      doc.removeEventListener('pointerup', up);
      doc.removeEventListener('pointercancel', cancel);
      this.stopGesture = undefined;
    };
    doc.addEventListener('pointermove', move);
    doc.addEventListener('pointerup', up);
    doc.addEventListener('pointercancel', cancel);
    this.stopGesture = stop;
  }

  protected cycle() {
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    const points = this.points();
    if (!points) return;
    const index = points.indexOf(this.current());
    this.setSnap(points[index >= points.length - 1 ? 0 : index + 1]);
  }
}

/** Every sheet part, with the Dialog parts used inside it. */
export const SheetParts = [
  SheetComponent,
  SheetContentComponent,
  DialogHeaderComponent,
  DialogTitleComponent,
  DialogDescriptionComponent,
  DialogBodyComponent,
  DialogFooterComponent,
  DialogCloseButtonComponent,
  DsDialogTrigger,
  DsDialogClose,
] as const;
