import {
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { byDocumentOrder, dataFlag, focusElement, openState } from '../utils/dom';
import { findNextIndex, keyToNavigation } from '../utils/navigation';
import {
  DsCollapsibleContent,
  DsCollapsibleContext,
  DsCollapsibleTrigger,
} from '../collapsible/collapsible.directive';

export type AccordionType = 'single' | 'multiple';
export type AccordionOrientation = 'horizontal' | 'vertical';
/** The open item (`type="single"`, `''` for none) or items (`type="multiple"`). */
export type AccordionValue = string | readonly string[];

interface AccordionTriggerRef {
  element: HTMLElement;
  disabled: () => boolean;
}

/**
 * A stack of collapsible sections. WAI-ARIA APG: Accordion. Headers are buttons inside
 * headings; arrow keys (along the orientation), Home and End move between them.
 *
 * ```html
 * <div dsAccordion type="single" collapsible [(value)]="open">
 *   <div dsAccordionItem value="install">
 *     <h3 dsAccordionHeader><button dsAccordionTrigger>How do I install it?</button></h3>
 *     <div dsAccordionContent #content="dsAccordionContent">
 *       @if (content.present()) { npm install pada-ds-angular }
 *     </div>
 *   </div>
 * </div>
 * ```
 *
 * Differences from React: `value` is one model for both types (a string for `single`, an array
 * for `multiple`), and the header is the `dsAccordionHeader` directive on your own heading
 * element instead of `asChild`.
 */
@Directive({
  selector: '[dsAccordion]',
  exportAs: 'dsAccordion',
  host: {
    'data-pada-accordion': '',
    '[attr.data-type]': 'type()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-disabled]': 'disabledFlag()',
    '[attr.dir]': 'dir()',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class DsAccordion {
  /** One item open at a time (`single`), or any number (`multiple`). @default 'single' */
  readonly type = input<AccordionType>('single');
  /**
   * The open item (`single`: a string, `''` for none) or items (`multiple`: an array).
   * Two-way bindable: `[(value)]`.
   */
  readonly value = model<AccordionValue>();
  /** `single` only: let the open item close again, leaving none open. */
  readonly collapsible = input(false, { transform: booleanAttribute });
  /** Disables every item. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Arrow keys follow the orientation: Up/Down when vertical, Left/Right when horizontal. */
  readonly orientation = input<AccordionOrientation>('vertical');
  /** Reading direction, for horizontal arrow keys. @default 'ltr' */
  readonly dir = input<'ltr' | 'rtl'>('ltr');

  protected readonly disabledFlag = computed(() => dataFlag(this.disabled()));
  /** The open items' values. */
  readonly openValues = computed<readonly string[]>(() => {
    const value = this.value();
    if (Array.isArray(value)) return value;
    return typeof value === 'string' && value ? [value] : [];
  });
  /** False when a single accordion must keep its open item open. */
  readonly canCollapse = computed(() => this.type() === 'multiple' || this.collapsible());

  private readonly triggers = signal<readonly AccordionTriggerRef[]>([]);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  register(trigger: AccordionTriggerRef) {
    this.triggers.update((triggers) => [...triggers, trigger]);
  }
  unregister(trigger: AccordionTriggerRef) {
    this.triggers.update((triggers) => triggers.filter((entry) => entry !== trigger));
  }

  toggle(item: string, open: boolean) {
    const current = this.openValues();
    if (this.type() === 'multiple') {
      const rest = current.filter((value) => value !== item);
      this.value.set(open ? [...rest, item] : rest);
    } else if (open) {
      this.value.set(item);
    } else if (this.collapsible()) {
      this.value.set('');
    }
  }

  protected onKeyDown(event: KeyboardEvent) {
    const step = keyToNavigation(event.key, this.orientation(), this.dir());
    if (!step) return;
    const triggers = this.triggers()
      .filter((trigger) => this.element.contains(trigger.element))
      .sort((a, b) => byDocumentOrder(a.element, b.element));
    const current = triggers.findIndex((trigger) => trigger.element === event.target);
    if (current === -1) return;
    const items = triggers.map((trigger) => ({
      label: trigger.element.textContent ?? '',
      disabled: trigger.disabled(),
    }));
    const next = findNextIndex(items, current, step, { loop: true });
    if (next === -1) return;
    event.preventDefault();
    focusElement(triggers[next].element);
  }
}

/** One section: a header with its trigger, and the content it shows. */
@Directive({
  selector: '[dsAccordionItem]',
  exportAs: 'dsAccordionItem',
  providers: [{ provide: DsCollapsibleContext, useExisting: DsAccordionItem }],
  host: {
    '[attr.data-state]': 'state()',
    '[attr.data-disabled]': 'disabledFlag()',
    '[attr.data-orientation]': 'accordion.orientation()',
  },
})
export class DsAccordionItem extends DsCollapsibleContext {
  protected readonly accordion = inject(DsAccordion);
  /** Identifies the item in the accordion's `value`. */
  readonly value = input.required<string>();
  /** Stops this item from opening or closing. */
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly open = computed(() => this.accordion.openValues().includes(this.value()));
  readonly isDisabled = computed(() => this.accordion.disabled() || this.disabled());
  protected readonly state = computed(() => openState(this.open()));
  protected readonly disabledFlag = computed(() => dataFlag(this.isDisabled()));

  setOpen(open: boolean) {
    this.accordion.toggle(this.value(), open);
  }
}

/** The heading that wraps the trigger. Put it on the heading element of the level you need. */
@Directive({
  selector: '[dsAccordionHeader]',
  host: {
    '[attr.data-state]': 'state()',
    '[attr.data-disabled]': 'disabledFlag()',
  },
})
export class DsAccordionHeader {
  private readonly context = inject(DsCollapsibleContext);
  protected readonly state = computed(() => openState(this.context.open()));
  protected readonly disabledFlag = computed(() => dataFlag(this.context.isDisabled()));
}

/**
 * The button that opens and closes its item. When a single accordion cannot collapse, the open
 * trigger is `aria-disabled`. Outside an accordion it works as a plain collapsible trigger.
 */
@Directive({
  selector: '[dsAccordionTrigger]',
  hostDirectives: [DsCollapsibleTrigger],
  host: {
    'data-pada-accordion-trigger': '',
    '[attr.data-orientation]': 'accordion?.orientation() ?? "vertical"',
    '[attr.aria-disabled]': 'locked() || null',
  },
})
export class DsAccordionTrigger implements OnInit, OnDestroy {
  protected readonly accordion = inject(DsAccordion, { optional: true });
  private readonly context = inject(DsCollapsibleContext);
  private readonly ref: AccordionTriggerRef = {
    element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
    disabled: () => this.context.isDisabled(),
  };
  /** The open item of a single accordion that cannot collapse. */
  protected readonly locked = computed(
    () => !!this.accordion && this.context.open() && !this.accordion.canCollapse(),
  );

  ngOnInit() {
    this.accordion?.register(this.ref);
  }
  ngOnDestroy() {
    this.accordion?.unregister(this.ref);
  }
}

/** The item's content: a region labelled by its trigger. Animatable while closing. */
@Directive({
  selector: '[dsAccordionContent]',
  exportAs: 'dsAccordionContent',
  hostDirectives: [DsCollapsibleContent],
  host: {
    role: 'region',
    '[attr.aria-labelledby]': 'context.triggerId',
    '[attr.data-orientation]': 'accordion?.orientation() ?? "vertical"',
  },
})
export class DsAccordionContent {
  protected readonly accordion = inject(DsAccordion, { optional: true });
  protected readonly context = inject(DsCollapsibleContext);
  /** Whether to render the children: while open, and while it animates closed. */
  readonly present = inject(DsCollapsibleContent).present.asReadonly();
}

/** Every accordion part, for `imports: [...DsAccordionParts]`. */
export const DsAccordionParts = [
  DsAccordion,
  DsAccordionItem,
  DsAccordionHeader,
  DsAccordionTrigger,
  DsAccordionContent,
] as const;
