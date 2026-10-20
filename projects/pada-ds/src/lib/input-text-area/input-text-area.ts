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
  DsField,
  DsFieldControl,
  DsFieldDescription,
  DsFieldError,
  DsFieldLabel,
  injectControlStatus,
  uniqueId,
} from 'pada-ds-angular/headless';

/**
 * A labelled multi-line text input with optional description and error, wired like
 * `ds-input-text`. Works with Angular forms (`formControlName`, `[(ngModel)]`) or on its own
 * (`[(value)]`).
 *
 * ```html
 * <ds-input-text-area label="Notes" description="Visible to your team." formControlName="notes" />
 * ```
 *
 * The error replaces the description while shown. With a forms control, `error` shows only
 * once the control is invalid and touched; without one, setting `error` marks it invalid.
 */
@Component({
  selector: 'ds-input-text-area',
  imports: [DsField, DsFieldLabel, DsFieldControl, DsFieldDescription, DsFieldError],
  templateUrl: './input-text-area.html',
  styleUrl: './input-text-area.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputTextAreaComponent implements ControlValueAccessor, OnInit {
  /** Visible label. */
  readonly label = input<string>();
  /** Help text under the textarea, hidden while the error shows. */
  readonly description = input<string>();
  /** Validation message. */
  readonly error = input<string>();
  /** The text. Two-way bindable: `[(value)]`. */
  readonly value = model('');
  readonly placeholder = input<string>();
  /** Visible lines of text. */
  readonly rows = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /** Maximum number of characters. */
  readonly maxLength = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  readonly required = input(false, { transform: booleanAttribute });
  /** Show "(optional)" after the label. */
  readonly optional = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Id of the textarea. Generated when omitted. */
  readonly inputId = input(uniqueId('ds-input-text-area-'));
  /** The textarea lost focus. */
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
    const value = (event.target as HTMLTextAreaElement).value;
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
