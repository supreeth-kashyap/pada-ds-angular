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
  DsField,
  DsFieldControl,
  DsFieldDescription,
  DsFieldError,
  DsFieldLabel,
  injectControlStatus,
  uniqueId,
} from 'pada-ds-angular/headless';

/**
 * A labelled text input with optional description, error and prefix/suffix content. Works with
 * Angular forms (`formControlName`, `[(ngModel)]`) or on its own (`[(value)]`).
 *
 * ```html
 * <ds-input-text label="Email" type="email" formControlName="email" error="Enter a valid email." />
 * <ds-input-text label="Price" [(value)]="price">
 *   <span dsPrefix>$</span>
 * </ds-input-text>
 * ```
 *
 * With a forms control, `error` shows only once the control is invalid and touched; without
 * one, setting `error` marks the input invalid.
 */
@Component({
  selector: 'ds-input-text',
  imports: [DsField, DsFieldLabel, DsFieldControl, DsFieldDescription, DsFieldError],
  templateUrl: './input-text.html',
  styleUrl: './input-text.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputTextComponent implements ControlValueAccessor, OnInit {
  /** Visible label. */
  readonly label = input<string>();
  /** Help text under the input, hidden while the error shows. */
  readonly description = input<string>();
  /** Validation message. */
  readonly error = input<string>();
  /** The value. Two-way bindable: `[(value)]`. */
  readonly value = model('');
  readonly type = input<'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number'>(
    'text',
  );
  readonly placeholder = input<string>();
  readonly autocomplete = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  /** Show "(optional)" after the label. */
  readonly optional = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Id of the input. Generated when omitted. */
  readonly inputId = input(uniqueId('ds-input-text-'));
  /** The input lost focus. */
  readonly blurred = output<FocusEvent>();

  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly invalid = computed(() =>
    this.status.ngControl ? this.status.invalid() : !!this.error(),
  );
  protected readonly isRequired = computed(() => this.required() || this.status.required());

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
