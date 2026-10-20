import {
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  model,
  numberAttribute,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { dataFlag } from '../utils/dom';
import { injectControlStatus } from '../utils/forms';
import { injectHiddenInputs } from '../utils/form-controls';

export type PinInputType = 'numeric' | 'alphanumeric';

/**
 * A row of single-character boxes for codes and PINs (`role="group"`). Name it with
 * `aria-label` or `aria-labelledby`. Works with Angular forms (a string) or through
 * `[(value)]`; a blank box between filled ones is a space in the value.
 *
 * ```html
 * <div dsPinInput [length]="4" [(value)]="pin" (complete)="verify($event)" aria-label="PIN">
 *   @for (index of [0, 1, 2, 3]; track index) {
 *     <input dsPinInputInput [index]="index" />
 *   }
 * </div>
 * ```
 */
@Directive({
  selector: '[dsPinInput]',
  exportAs: 'dsPinInput',
  host: {
    role: 'group',
    '[attr.data-disabled]': 'flag(isDisabled())',
    '[attr.data-complete]': 'flag(isComplete())',
  },
})
export class DsPinInput implements ControlValueAccessor, OnInit {
  /** Number of characters. */
  readonly length = input.required({ transform: numberAttribute });
  /** The characters so far (may be shorter than `length`). Two-way bindable. */
  readonly value = model('');
  /** Accepted characters. @default 'numeric' */
  readonly type = input<PinInputType>('numeric');
  /** Hide the characters, like a password. */
  readonly mask = input(false, { transform: booleanAttribute });
  /** One-time code: lets browsers and phones autofill it from a text message. @default true */
  readonly otp = input(true, { transform: booleanAttribute });
  /** Disables every box. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Placeholder in each empty box. */
  readonly placeholder = input('');
  /** Submits the joined value with a native form under this name. */
  readonly name = input<string>();
  /** Every box is filled; emits the full code. */
  readonly complete = output<string>();

  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  /** Disabled through the input or the forms control. */
  readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  /** One entry per box, `''` when empty. */
  readonly chars = computed(() =>
    Array.from({ length: this.length() }, (_, index) => (this.value()[index] ?? '').trim()),
  );
  readonly isComplete = computed(() => this.chars().every(Boolean));
  protected readonly flag = dataFlag;

  private readonly inputs = new Map<number, HTMLInputElement>();
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    injectHiddenInputs(() => ({
      name: this.name(),
      values: [this.chars().join('')],
      disabled: this.isDisabled(),
    }));
  }

  ngOnInit() {
    this.status.connect();
  }

  private update(next: string[]) {
    // Keep characters in place but drop trailing blanks, so "12" + blank + "4" stays positional.
    const joined = next
      .map((char) => char || ' ')
      .join('')
      .trimEnd();
    if (joined !== this.value()) {
      this.value.set(joined);
      this.onChange(joined);
    }
    if (next.length === this.length() && next.every(Boolean)) this.complete.emit(next.join(''));
  }

  /** Writes `text` from `index` on (typing, paste, autofill) and returns the next index to focus. */
  write(index: number, text: string): number {
    const pattern = this.type() === 'numeric' ? /\d/ : /[\p{L}\p{N}]/u;
    const accepted = [...text].filter((char) => pattern.test(char));
    if (accepted.length === 0) return index;
    const length = this.length();
    const next = [...this.chars()];
    // A full code pasted (or autofilled) into any box fills the boxes from the start.
    const start = accepted.length >= length ? 0 : index;
    accepted.slice(0, length - start).forEach((char, offset) => {
      next[start + offset] = char;
    });
    this.update(next);
    return Math.min(length - 1, start + accepted.length);
  }

  /** Empties one box. */
  clear(index: number) {
    const next = [...this.chars()];
    next[index] = '';
    this.update(next);
  }

  /** Focuses (and selects) a box, clamped to the row. */
  focusInput(index: number) {
    const element = this.inputs.get(Math.max(0, Math.min(index, this.length() - 1)));
    element?.focus();
    element?.select();
  }

  /** @internal */
  register(index: number, element: HTMLInputElement) {
    this.inputs.set(index, element);
  }
  /** @internal */
  unregister(index: number, element: HTMLInputElement) {
    if (this.inputs.get(index) === element) this.inputs.delete(index);
  }
  /** @internal A box lost focus. */
  markTouched() {
    this.onTouched();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (value: string) => void): void {
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
 * One box. Typing fills it and moves on; Backspace clears it (or the previous box); the arrow
 * keys, Home and End move between boxes; pasting a code fills them all.
 */
@Directive({
  selector: 'input[dsPinInputInput]',
  host: {
    autocapitalize: 'none',
    spellcheck: 'false',
    '[type]': 'root.mask() ? "password" : "text"',
    '[attr.inputmode]': 'root.type() === "numeric" ? "numeric" : "text"',
    '[attr.pattern]': 'root.type() === "numeric" ? "[0-9]*" : null',
    '[attr.autocomplete]': 'root.otp() && index() === 0 ? "one-time-code" : "off"',
    '[attr.aria-label]': 'accessibleName()',
    '[attr.placeholder]': 'root.placeholder() || null',
    '[disabled]': 'root.isDisabled()',
    '[attr.data-filled]': 'flag(!!char())',
    '[value]': 'char()',
    '(input)': 'handleInput()',
    '(paste)': 'handlePaste($event)',
    '(keydown)': 'handleKeydown($event)',
    '(focus)': 'element.select()',
    '(blur)': 'root.markTouched()',
  },
})
export class DsPinInputInput implements OnInit, OnDestroy {
  protected readonly root = inject(DsPinInput);
  protected readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  /** Position of this box, from 0. */
  readonly index = input.required({ transform: numberAttribute });
  /** Accessible name. @default 'Character <n> of <length>' */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  protected readonly char = computed(() => this.root.chars()[this.index()] ?? '');
  protected readonly accessibleName = computed(
    () => this.ariaLabel() ?? `Character ${this.index() + 1} of ${this.root.length()}`,
  );
  protected readonly flag = dataFlag;
  private registered = -1;

  ngOnInit() {
    this.registered = this.index();
    this.root.register(this.registered, this.element);
  }
  ngOnDestroy() {
    this.root.unregister(this.registered, this.element);
  }

  protected handleInput() {
    const char = this.char();
    const text = this.element.value;
    // Autofill and some keyboards put several characters into one box at once.
    const typed = text.replace(char, '') || text;
    const next = this.root.write(this.index(), typed);
    // Rejected characters must not stay in the box (the value binding did not change).
    this.element.value = this.char();
    this.root.focusInput(next);
  }

  protected handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    this.root.focusInput(this.root.write(this.index(), event.clipboardData?.getData('text') ?? ''));
  }

  protected handleKeydown(event: KeyboardEvent) {
    const index = this.index();
    const moves: Record<string, number> = {
      ArrowLeft: index - 1,
      ArrowRight: index + 1,
      Home: 0,
      End: this.root.length() - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      this.root.focusInput(moves[event.key]);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      if (this.char()) this.root.clear(index);
      else if (index > 0) {
        this.root.clear(index - 1);
        this.root.focusInput(index - 1);
      }
    } else if (event.key === 'Delete') {
      event.preventDefault();
      this.root.clear(index);
    }
  }
}

/** Every pin input part, for `imports: [DsPinInputParts]`. */
export const DsPinInputParts = [DsPinInput, DsPinInputInput] as const;
