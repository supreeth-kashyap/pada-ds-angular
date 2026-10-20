import {
  afterNextRender,
  AfterRenderRef,
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  model,
  Signal,
  untracked,
} from '@angular/core';
import { injectButtonType } from '../utils/button';
import { dataFlag, openState } from '../utils/dom';
import { uniqueId } from '../utils/id';
import { getExitDuration } from '../utils/presence';

/**
 * The state of one disclosure, shared by its trigger and content. Provided by `dsCollapsible`
 * and by `dsAccordionItem`, so the collapsible trigger and content parts work in both.
 */
export abstract class DsCollapsibleContext {
  abstract readonly open: Signal<boolean>;
  abstract readonly isDisabled: Signal<boolean>;
  abstract setOpen(open: boolean): void;
  readonly contentId = uniqueId('ds-collapsible-');
  readonly triggerId = `${this.contentId}-trigger`;
}

/**
 * Holds the open state of one disclosure. WAI-ARIA APG: Disclosure.
 *
 * ```html
 * <div dsCollapsible [(open)]="details">
 *   <button dsCollapsibleTrigger>Show details</button>
 *   <div dsCollapsibleContent #content="dsCollapsibleContent">
 *     @if (content.present()) { … }
 *   </div>
 * </div>
 * ```
 */
@Directive({
  selector: '[dsCollapsible]',
  exportAs: 'dsCollapsible',
  providers: [{ provide: DsCollapsibleContext, useExisting: DsCollapsible }],
  host: {
    '[attr.data-state]': 'state()',
    '[attr.data-disabled]': 'disabledFlag()',
  },
})
export class DsCollapsible extends DsCollapsibleContext {
  /** Whether the content is shown. Two-way bindable: `[(open)]`. */
  readonly open = model(false);
  /** Stops the trigger from toggling. */
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly isDisabled = computed(() => this.disabled());
  protected readonly state = computed(() => openState(this.open()));
  protected readonly disabledFlag = computed(() => dataFlag(this.disabled()));

  setOpen(open: boolean) {
    this.open.set(open);
  }
}

/** The button that shows and hides the content: `aria-expanded`, `aria-controls`. */
@Directive({
  selector: '[dsCollapsibleTrigger]',
  host: {
    '[id]': 'context.triggerId',
    '[attr.aria-expanded]': 'context.open()',
    '[attr.aria-controls]': 'context.contentId',
    '[attr.disabled]': 'disabledFlag()',
    '[attr.data-state]': 'state()',
    '[attr.data-disabled]': 'disabledFlag()',
    '(click)': 'toggle()',
  },
})
export class DsCollapsibleTrigger {
  protected readonly context = inject(DsCollapsibleContext);
  protected readonly state = computed(() => openState(this.context.open()));
  protected readonly disabledFlag = computed(() => dataFlag(this.context.isDisabled()));

  constructor() {
    injectButtonType();
  }

  protected toggle() {
    if (!this.context.isDisabled()) this.context.setOpen(!this.context.open());
  }
}

/**
 * The content. It stays in the DOM (with `hidden`) while closed, so `aria-controls` always
 * points somewhere, and stays visible with `data-state="closed"` until its exit transition ends,
 * so its height can animate. `present()` tells whether to render the children (the styled skin
 * renders them only while present, like React).
 */
@Directive({
  selector: '[dsCollapsibleContent]',
  exportAs: 'dsCollapsibleContent',
  host: {
    '[id]': 'context.contentId',
    '[attr.hidden]': 'present() ? null : ""',
    '[attr.data-state]': 'state()',
    '[attr.data-disabled]': 'disabledFlag()',
  },
})
export class DsCollapsibleContent {
  protected readonly context = inject(DsCollapsibleContext);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  protected readonly state = computed(() => openState(this.context.open()));
  protected readonly disabledFlag = computed(() => dataFlag(this.context.isDisabled()));

  /** Whether the content is shown: while open, and while it animates closed. */
  readonly present = linkedSignal<boolean, boolean>({
    source: this.context.open,
    computation: (open, previous) => open || (previous?.value ?? false),
  });

  private exit: { ref: AfterRenderRef; timer?: ReturnType<typeof setTimeout> } | null = null;

  constructor() {
    effect(() => {
      const open = this.context.open();
      untracked(() => (open ? this.cancelExit() : this.startExit()));
    });
    inject(DestroyRef).onDestroy(() => this.cancelExit());
  }

  private cancelExit() {
    if (!this.exit) return;
    this.exit.ref.destroy();
    clearTimeout(this.exit.timer);
    this.exit = null;
  }

  private startExit() {
    if (this.exit || !this.present()) return;
    const finish = () => {
      this.exit = null;
      if (!this.context.open()) this.present.set(false);
    };
    // Measured after the render that set data-state="closed", so the closed styles apply.
    const ref = afterNextRender(
      {
        read: () => {
          const duration = getExitDuration(this.element);
          if (duration === 0) finish();
          else if (this.exit) this.exit.timer = setTimeout(finish, duration + 34);
        },
      },
      { injector: this.injector },
    );
    this.exit = { ref };
  }
}

/** Every collapsible part, for `imports: [...DsCollapsibleParts]`. */
export const DsCollapsibleParts = [
  DsCollapsible,
  DsCollapsibleTrigger,
  DsCollapsibleContent,
] as const;
