import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import {
  dataFlag,
  DsField,
  DsFieldControl,
  DsFieldDescription,
  DsFieldError,
  DsFieldLabel,
  injectControlStatus,
  uniqueId,
} from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';
import { estimatePasswordStrength, PasswordStrength, STRENGTH_LABELS } from './password-strength';

export type PasswordInputSize = 'sm' | 'md' | 'lg';

/** `strength` as an attribute: present (or `true`) estimates, a number is your own score. */
function strengthAttribute(value: unknown): boolean | PasswordStrength {
  if (value === '' || value === true || value === 'true') return true;
  const score = Number(value);
  return typeof value !== 'boolean' &&
    value !== null &&
    value !== undefined &&
    score >= 0 &&
    score <= 4
    ? (Math.round(score) as PasswordStrength)
    : false;
}

/**
 * A password field with a show/hide toggle and an optional strength meter. Defaults to
 * `autocomplete="current-password"`; use `"new-password"` on sign-up and change forms. Works
 * with Angular forms or through `[(value)]`.
 *
 * ```html
 * <ds-password-input label="Password" formControlName="password" />
 * <ds-password-input label="New password" autocomplete="new-password" strength [(value)]="next" />
 * ```
 *
 * The toggle is a pressed button ("Show password", `aria-pressed`); `[(visible)]` binds its
 * state. With a forms control, `error` shows once the control is invalid and touched.
 */
@Component({
  selector: 'ds-password-input',
  imports: [DsField, DsFieldLabel, DsFieldControl, DsFieldDescription, DsFieldError, IconComponent],
  templateUrl: './password-input.html',
  styleUrl: './password-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordInputComponent implements ControlValueAccessor, OnInit {
  /** Visible label. */
  readonly label = input.required<string>();
  /** Help text under the field, hidden while the error shows. */
  readonly description = input<string>();
  /** Validation message. */
  readonly error = input<string>();
  /** The password. Two-way bindable: `[(value)]`. */
  readonly value = model('');
  /** Whether the password shows as text. Two-way bindable: `[(visible)]`. */
  readonly visible = model(false);
  /** A strength meter: `true` (or the bare attribute) estimates, a number 0–4 is your own score. */
  readonly strength = input<boolean | PasswordStrength, unknown>(false, {
    transform: strengthAttribute,
  });
  /** @default 'current-password' */
  readonly autocomplete = input('current-password');
  readonly placeholder = input<string>();
  /** Control height. @default 'md' */
  readonly size = input<PasswordInputSize>('md');
  readonly required = input(false, { transform: booleanAttribute });
  /** Show "(optional)" after the label. */
  readonly optional = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Name for native form submission. */
  readonly name = input<string>();
  /** Id of the input. Generated when omitted. */
  readonly inputId = input(uniqueId('ds-password-input-'));
  /** The input lost focus. */
  readonly blurred = output<FocusEvent>();

  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly invalid = computed(() =>
    this.status.ngControl ? this.status.invalid() : !!this.error(),
  );
  protected readonly isRequired = computed(() => this.required() || this.status.required());
  protected readonly score = computed<PasswordStrength | null>(() => {
    const strength = this.strength();
    if (strength === false) return null;
    return strength === true ? estimatePasswordStrength(this.value()) : strength;
  });
  protected readonly scoreLabel = computed(() => {
    const score = this.score();
    return score === null ? '' : STRENGTH_LABELS[score];
  });
  protected readonly bars = [1, 2, 3, 4];
  protected readonly flag = dataFlag;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
  }

  protected handleInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value);
  }

  protected handleBlur(event: FocusEvent) {
    this.onTouched();
    this.blurred.emit(event);
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
