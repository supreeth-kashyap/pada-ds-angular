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
import { ControlValueAccessor } from '@angular/forms';
import { injectButtonType } from '../utils/button';
import { byDocumentOrder, dataFlag, focusElement } from '../utils/dom';
import { injectControlStatus } from '../utils/forms';
import { findNextIndex, keyToNavigation } from '../utils/navigation';

/**
 * A two-state button: `aria-pressed` and `data-state="on|off"`. Works with Angular forms
 * (a boolean) or on its own through `[(pressed)]`.
 *
 * ```html
 * <button dsToggle [(pressed)]="bold" aria-label="Bold">B</button>
 * ```
 */
@Directive({
  selector: '[dsToggle]',
  exportAs: 'dsToggle',
  host: {
    '[attr.aria-pressed]': 'pressed()',
    '[attr.data-state]': 'pressed() ? "on" : "off"',
    '[attr.data-disabled]': 'flag(isDisabled())',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '(click)': 'handleClick($event)',
    '(blur)': 'onTouched()',
  },
})
export class DsToggle implements ControlValueAccessor, OnInit {
  /** Whether the toggle is pressed. Two-way bindable: `[(pressed)]`. */
  readonly pressed = model(false);
  /** Disables the toggle. */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  /** Disabled through the input or the forms control. */
  readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly flag = dataFlag;

  private onChange: (pressed: boolean) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    injectButtonType();
  }

  ngOnInit() {
    this.status.connect();
  }

  protected handleClick(event: Event) {
    if (event.defaultPrevented || this.isDisabled()) return;
    const pressed = !this.pressed();
    this.pressed.set(pressed);
    this.onChange(pressed);
  }

  writeValue(value: boolean | null): void {
    this.pressed.set(!!value);
  }
  registerOnChange(fn: (pressed: boolean) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}

export type ToggleGroupType = 'single' | 'multiple';

const toArray = (value: string | readonly string[] | null | undefined): string[] =>
  Array.isArray(value) ? [...value] : value ? [value as string] : [];

/**
 * A set of toggle buttons with one tab stop and arrow-key movement (roving focus). `single`
 * presses one item at a time (like radio buttons, but it can be cleared) and its value is a
 * string (`''` when none); `multiple` presses any number and its value is a string array.
 * Works with Angular forms or through `[(value)]`. Name it with `aria-label`.
 *
 * ```html
 * <div dsToggleGroup type="single" [(value)]="view" aria-label="View">
 *   <button dsToggleGroupItem value="list">List</button>
 *   <button dsToggleGroupItem value="board">Board</button>
 * </div>
 * ```
 */
@Directive({
  selector: '[dsToggleGroup]',
  exportAs: 'dsToggleGroup',
  host: {
    role: 'group',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-disabled]': 'flag(isDisabled())',
    '[attr.dir]': 'dir() ?? null',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class DsToggleGroup implements ControlValueAccessor, OnInit {
  /** `single`: at most one item pressed; `multiple`: any number. @default 'single' */
  readonly type = input<ToggleGroupType>('single');
  /** The pressed item(s): a string for `single` (`''` when none), an array for `multiple`. Two-way bindable. */
  readonly value = model<string | string[]>('');
  /** Arrow keys follow the orientation. @default 'horizontal' */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /** Wrap focus from the last item to the first and back. @default true */
  readonly loop = input(true, { transform: booleanAttribute });
  /** Disables every item. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Reading direction for the arrow keys. Set on the element as `dir` when given. */
  readonly dir = input<'ltr' | 'rtl'>();

  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  /** Disabled through the input or the forms control. */
  readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  /** The pressed values as an array, whatever the type. */
  readonly values = computed(() => toArray(this.value()));
  protected readonly flag = dataFlag;

  private readonly items = signal<readonly DsToggleGroupItem[]>([]);
  private readonly focused = signal<DsToggleGroupItem | null>(null);
  private readonly ordered = computed(() =>
    [...this.items()].sort((a, b) => byDocumentOrder(a.element, b.element)),
  );
  /** The item in the tab order: the last focused, else the first pressed, else the first. */
  readonly tabStop = computed(() => {
    const enabled = this.ordered().filter((item) => !item.isDisabled());
    const focused = this.focused();
    if (focused && enabled.includes(focused)) return focused;
    const values = this.values();
    return enabled.find((item) => values.includes(item.value())) ?? enabled[0] ?? null;
  });

  private onChange: (value: string | string[]) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
  }

  register(item: DsToggleGroupItem) {
    this.items.update((items) => [...items, item]);
  }
  unregister(item: DsToggleGroupItem) {
    this.items.update((items) => items.filter((entry) => entry !== item));
    if (this.focused() === item) this.focused.set(null);
  }
  /** Makes the item the tab stop (it received focus). */
  focusItem(item: DsToggleGroupItem) {
    this.focused.set(item);
  }
  markTouched() {
    this.onTouched();
  }

  /** Presses or releases an item, as a click does. */
  toggle(item: string) {
    const values = this.values();
    const pressed = values.includes(item);
    let next: string | string[];
    if (this.type() === 'single') next = pressed ? '' : item;
    else next = pressed ? values.filter((entry) => entry !== item) : [...values, item];
    this.value.set(next);
    this.onChange(next);
  }

  protected handleKeydown(event: KeyboardEvent) {
    const step = keyToNavigation(event.key, this.orientation(), this.dir() ?? 'ltr');
    if (!step) return;
    const items = this.ordered();
    const from = items.findIndex((item) => item.element === event.target);
    if (from === -1) return;
    const descriptors = items.map((item) => ({
      label: item.element.textContent ?? '',
      disabled: item.isDisabled(),
    }));
    const next = findNextIndex(descriptors, from, step, { loop: this.loop() });
    if (next === -1) return;
    event.preventDefault();
    this.focused.set(items[next]);
    focusElement(items[next].element);
  }

  writeValue(value: string | string[] | null): void {
    this.value.set(this.type() === 'multiple' ? toArray(value) : (toArray(value)[0] ?? ''));
  }
  registerOnChange(fn: (value: string | string[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}

/** One item of a toggle group: `aria-pressed`, `data-state="on|off"`, roving `tabindex`. */
@Directive({
  selector: '[dsToggleGroupItem]',
  exportAs: 'dsToggleGroupItem',
  host: {
    'data-toggle-group-item': '',
    '[attr.aria-pressed]': 'pressed()',
    '[attr.data-state]': 'pressed() ? "on" : "off"',
    '[attr.data-disabled]': 'flag(isDisabled())',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.data-value]': 'value()',
    '[attr.tabindex]': 'tabIndex()',
    '(click)': 'handleClick($event)',
    '(focus)': 'group.focusItem(this)',
    '(blur)': 'group.markTouched()',
  },
})
export class DsToggleGroupItem implements OnInit, OnDestroy {
  protected readonly group = inject(DsToggleGroup);
  /** @internal */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** This item's value. */
  readonly value = input.required<string>();
  /** Disables this item. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Whether the item is pressed. */
  readonly pressed = computed(() => this.group.values().includes(this.value()));
  /** Disabled itself or through the group. */
  readonly isDisabled = computed(() => this.disabled() || this.group.isDisabled());
  protected readonly tabIndex = computed(() => (this.group.tabStop() === this ? 0 : -1));
  protected readonly flag = dataFlag;

  constructor() {
    injectButtonType();
  }

  ngOnInit() {
    this.group.register(this);
  }
  ngOnDestroy() {
    this.group.unregister(this);
  }

  protected handleClick(event: Event) {
    if (event.defaultPrevented || this.isDisabled()) return;
    this.group.toggle(this.value());
  }
}

/** The toggle group parts, for `imports: [DsToggleGroupParts]`. */
export const DsToggleGroupParts = [DsToggleGroup, DsToggleGroupItem] as const;
