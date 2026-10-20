import {
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  numberAttribute,
  OnInit,
  signal,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { DsField } from '../field/field.directive';
import { injectButtonType } from '../utils/button';
import { dataFlag } from '../utils/dom';
import { injectControlStatus } from '../utils/forms';
import { clamp, injectHiddenInputs } from '../utils/form-controls';
import { uniqueId } from '../utils/id';
import { createNumberFormatter, roundToPrecision } from './number-format';

/** `undefined` stays unset; anything else is a number attribute. */
const optionalNumber = (value: unknown): number | undefined =>
  value === undefined || value === null || value === '' ? undefined : numberAttribute(value);

/**
 * Holds a number and its limits (WAI-ARIA APG: Spinbutton). The value is `null` when empty.
 * Works with Angular forms or through `[(value)]`.
 *
 * ```html
 * <div dsNumberInput [(value)]="quantity" [min]="0" [max]="10">
 *   <button dsNumberInputDecrement>−</button>
 *   <input dsNumberInputInput aria-label="Quantity" />
 *   <button dsNumberInputIncrement>+</button>
 * </div>
 * ```
 *
 * Inside a `dsField`, the input takes the field's control id; add `dsFieldControl` to the
 * input for the description and error wiring.
 */
@Directive({
  selector: '[dsNumberInput]',
  exportAs: 'dsNumberInput',
  host: {
    '[attr.data-disabled]': 'flag(isDisabled())',
    '[attr.data-readonly]': 'flag(readonly())',
  },
})
export class DsNumberInput implements ControlValueAccessor, OnInit {
  /** The value, `null` when empty. Changes on step, Enter or blur. Two-way bindable. */
  readonly value = model<number | null>(null);
  /** @default -Infinity */
  readonly min = input(-Infinity, { transform: numberAttribute });
  /** @default Infinity */
  readonly max = input(Infinity, { transform: numberAttribute });
  /** Arrow keys and the steppers change the value by this much. @default 1 */
  readonly step = input(1, { transform: numberAttribute });
  /** PageUp and PageDown change the value by this much. @default step × 10 */
  readonly largeStep = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /** Display format: currency, percent, units, fraction digits. */
  readonly formatOptions = input<Intl.NumberFormatOptions>();
  /** Locale for formatting and parsing. Defaults to the browser's. */
  readonly locale = input<string>();
  /** Disables the input and the steppers. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The value can be read and copied but not changed. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Id of the input. Generated when omitted; inside a `dsField`, the field's control id wins. */
  readonly inputId = input(uniqueId('ds-number-input-'));
  /** Submits the raw number (not the formatted text) with a native form under this name. */
  readonly name = input<string>();

  private readonly status = injectControlStatus(this);
  private readonly field = inject(DsField, { optional: true });
  private readonly formsDisabled = signal(false);
  /** Disabled through the input, the forms control or the field. */
  readonly isDisabled = computed(
    () => this.disabled() || this.formsDisabled() || !!this.field?.isDisabled(),
  );
  /** The id the input gets. */
  readonly controlId = computed(() => this.field?.controlId() ?? this.inputId());
  /** The PageUp/PageDown step. */
  readonly bigStep = computed(() => this.largeStep() ?? this.step() * 10);
  readonly formatter = computed(() => createNumberFormatter(this.locale(), this.formatOptions()));
  /** Text being typed, before it is committed (null when not editing). */
  readonly draft = signal<string | null>(null);
  /** The input element, registered by `dsNumberInputInput`. */
  readonly input = signal<HTMLInputElement | null>(null);
  protected readonly flag = dataFlag;

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    injectHiddenInputs(() => ({
      name: this.name(),
      values: [String(this.value() ?? '')],
      disabled: this.isDisabled(),
    }));
  }

  ngOnInit() {
    this.status.connect();
  }

  /** Clamps, removes floating-point noise and stores; clears the draft. */
  commit(next: number | null) {
    this.draft.set(null);
    const committed =
      next === null ? null : roundToPrecision(clamp(next, this.min(), this.max()), this.step());
    if (committed === this.value()) return;
    this.value.set(committed);
    this.onChange(committed);
  }

  /** Steps from the current value (or the typed text) by `multiplier` steps. */
  stepBy(multiplier: number) {
    const draft = this.draft();
    const typed = draft === null ? this.value() : this.formatter().parse(draft);
    const min = this.min();
    const start = typed ?? (Number.isFinite(min) ? min : 0);
    // From empty, the first step lands on the start value itself.
    this.commit(typed === null ? start : start + this.step() * multiplier);
  }

  /** @internal The input lost focus. */
  markTouched() {
    this.onTouched();
  }

  writeValue(value: number | null): void {
    this.draft.set(null);
    this.value.set(typeof value === 'number' && !Number.isNaN(value) ? value : null);
  }
  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}

/**
 * The text input, `role="spinbutton"`: Up/Down step, PageUp/PageDown take a large step,
 * Home/End jump to min/max. Typed text is parsed in the locale and committed on Enter or blur.
 */
@Directive({
  selector: 'input[dsNumberInputInput]',
  host: {
    type: 'text',
    role: 'spinbutton',
    autocomplete: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    '[attr.inputmode]': 'inputMode()',
    '[id]': 'root.controlId()',
    '[attr.aria-valuenow]': 'root.value()',
    '[attr.aria-valuetext]': 'valueText()',
    '[attr.aria-valuemin]': 'finite(root.min())',
    '[attr.aria-valuemax]': 'finite(root.max())',
    '[disabled]': 'root.isDisabled()',
    '[readOnly]': 'root.readonly()',
    '[value]': 'text()',
    '(input)': 'root.draft.set($any($event.target).value)',
    '(blur)': 'handleBlur()',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class DsNumberInputInput implements OnInit {
  protected readonly root = inject(DsNumberInput);
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  protected readonly text = computed(() => {
    const draft = this.root.draft();
    if (draft !== null) return draft;
    const value = this.root.value();
    return value === null ? '' : this.root.formatter().format(value);
  });
  protected readonly valueText = computed(() => {
    const value = this.root.value();
    return value === null ? null : this.root.formatter().format(value);
  });
  protected readonly inputMode = computed(() =>
    this.root.step() % 1 === 0 && this.root.min() >= 0 ? 'numeric' : 'decimal',
  );
  protected readonly finite = (value: number) => (Number.isFinite(value) ? value : null);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.root.input() === this.element) this.root.input.set(null);
    });
  }

  ngOnInit() {
    this.root.input.set(this.element);
  }

  protected handleBlur() {
    const draft = this.root.draft();
    if (draft !== null) this.root.commit(this.root.formatter().parse(draft));
    this.root.markTouched();
  }

  protected handleKeydown(event: KeyboardEvent) {
    const root = this.root;
    if (root.readonly() || root.isDisabled()) return;
    const min = root.min();
    const max = root.max();
    // Home/End only act as spinbutton keys when there is a bound to jump to.
    if (
      (event.key === 'Home' && !Number.isFinite(min)) ||
      (event.key === 'End' && !Number.isFinite(max))
    )
      return;
    const ratio = root.bigStep() / root.step();
    const actions: Record<string, () => void> = {
      ArrowUp: () => root.stepBy(1),
      ArrowDown: () => root.stepBy(-1),
      PageUp: () => root.stepBy(ratio),
      PageDown: () => root.stepBy(-ratio),
      Home: () => root.commit(min),
      End: () => root.commit(max),
      Enter: () => {
        const draft = root.draft();
        if (draft !== null) root.commit(root.formatter().parse(draft));
      },
    };
    const action = actions[event.key];
    if (!action) return;
    if (event.key !== 'Enter') event.preventDefault();
    action();
  }
}

const REPEAT_DELAY = 400;
const REPEAT_INTERVAL = 60;

/** Shared behaviour of the increment and decrement buttons. */
@Directive({
  host: {
    tabindex: '-1',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-controls]': 'root.controlId()',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.data-disabled]': 'flag(isDisabled())',
    '(pointerdown)': 'handlePointerDown($event)',
    '(pointerup)': 'stop()',
    '(pointerleave)': 'stop()',
    '(pointercancel)': 'stop()',
    '(click)': 'handleClick($event)',
  },
})
export abstract class DsNumberInputStepper {
  protected readonly root = inject(DsNumberInput);
  protected abstract readonly direction: 1 | -1;
  /** Accessible name. */
  abstract readonly ariaLabel: () => string;

  protected readonly flag = dataFlag;
  /** Disabled with the input, when read-only, or at the limit it steps towards. */
  readonly isDisabled = computed(() => {
    const value = this.root.value();
    const atLimit =
      value !== null &&
      (this.direction === 1 ? value >= this.root.max() : value <= this.root.min());
    return this.root.isDisabled() || this.root.readonly() || atLimit;
  });
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    injectButtonType();
    // Stop repeating when the limit is reached.
    effect(() => {
      if (this.isDisabled()) this.stop();
    });
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  protected stop() {
    clearTimeout(this.timer);
  }

  protected handlePointerDown(event: PointerEvent) {
    if (this.isDisabled() || event.button !== 0) return;
    // Keep focus (and the caret) in the input.
    event.preventDefault();
    this.root.input()?.focus();
    this.stop();
    this.root.stepBy(this.direction);
    const repeat = (delay: number) => {
      this.timer = setTimeout(() => {
        this.root.stepBy(this.direction);
        repeat(REPEAT_INTERVAL);
      }, delay);
    };
    repeat(REPEAT_DELAY);
  }

  protected handleClick(event: MouseEvent) {
    // A click without a pointer-down (assistive technology, el.click()) still steps.
    if (event.detail === 0 && !this.isDisabled()) this.root.stepBy(this.direction);
  }
}

/** Steps the value up; hold to repeat. Out of the tab order: the input's arrow keys do the same. */
@Directive({ selector: 'button[dsNumberInputIncrement]' })
export class DsNumberInputIncrement extends DsNumberInputStepper {
  protected readonly direction = 1;
  /** Accessible name. @default 'Increase' */
  readonly ariaLabel = input('Increase', { alias: 'aria-label' });
}

/** Steps the value down; hold to repeat. Out of the tab order. */
@Directive({ selector: 'button[dsNumberInputDecrement]' })
export class DsNumberInputDecrement extends DsNumberInputStepper {
  protected readonly direction = -1;
  /** Accessible name. @default 'Decrease' */
  readonly ariaLabel = input('Decrease', { alias: 'aria-label' });
}

/** Every number input part, for `imports: [DsNumberInputParts]`. */
export const DsNumberInputParts = [
  DsNumberInput,
  DsNumberInputInput,
  DsNumberInputIncrement,
  DsNumberInputDecrement,
] as const;
