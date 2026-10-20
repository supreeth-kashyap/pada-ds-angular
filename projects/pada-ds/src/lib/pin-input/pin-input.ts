import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  numberAttribute,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import {
  dataFlag,
  DsPinInputParts,
  injectControlStatus,
  PinInputType,
  uniqueId,
} from 'pada-ds-angular/headless';

export type PinInputSize = 'sm' | 'md' | 'lg';

/**
 * A code or PIN field with one box per character. Typing moves to the next box, Backspace goes
 * back, the arrow keys, Home and End move between boxes, and pasting (or a phone autofilling a
 * code from a text message) fills every box. Works with Angular forms (a string) or through
 * `[(value)]`.
 *
 * ```html
 * <ds-pin-input label="Verification code" [length]="6" [groupSize]="3"
 *   formControlName="code" (complete)="verify($event)" />
 * ```
 *
 * With a forms control, `error` shows once the control is invalid and touched; without one,
 * setting `error` marks the boxes invalid.
 */
@Component({
  selector: 'ds-pin-input',
  imports: [DsPinInputParts],
  templateUrl: './pin-input.html',
  styleUrl: './pin-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinInputComponent implements ControlValueAccessor, OnInit {
  /** Visible label naming the group of boxes. */
  readonly label = input.required<string>();
  /** Number of characters. */
  readonly length = input.required({ transform: numberAttribute });
  /** Help text under the boxes. */
  readonly description = input<string>();
  /** Validation message. */
  readonly error = input<string>();
  /** The characters so far. Two-way bindable: `[(value)]`. */
  readonly value = model('');
  /** Accepted characters. @default 'numeric' */
  readonly type = input<PinInputType>('numeric');
  /** Hide the characters, like a password. */
  readonly mask = input(false, { transform: booleanAttribute });
  /** One-time code: lets browsers and phones autofill it. @default true */
  readonly otp = input(true, { transform: booleanAttribute });
  /** Put a separator after every `groupSize` boxes (3 makes "123–456"). */
  readonly groupSize = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /** Box size. @default 'md' */
  readonly size = input<PinInputSize>('md');
  /** Placeholder in each empty box. */
  readonly placeholder = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Submits the joined value with a native form under this name. */
  readonly name = input<string>();
  /** Every box is filled; emits the full code. */
  readonly complete = output<string>();

  protected readonly id = uniqueId('ds-pin-input-');
  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly invalid = computed(() =>
    this.status.ngControl ? this.status.invalid() : !!this.error(),
  );
  protected readonly showError = computed(() => !!this.error() && this.invalid());
  protected readonly indexes = computed(() =>
    Array.from({ length: this.length() }, (_, index) => index),
  );
  protected readonly describedBy = computed(
    () =>
      [this.description() && `${this.id}-description`, this.showError() && `${this.id}-error`]
        .filter(Boolean)
        .join(' ') || null,
  );
  protected readonly flag = dataFlag;

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
  }

  protected handleChange(value: string) {
    this.value.set(value);
    this.onChange(value);
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
