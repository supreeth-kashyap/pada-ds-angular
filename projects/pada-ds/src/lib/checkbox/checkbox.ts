import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  OnInit,
  signal,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import {
  dataFlag,
  injectControlStatus,
  injectFieldContext,
  uniqueId,
} from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

/**
 * A checkbox with an optional label, and an indeterminate (mixed) state for "select all"
 * boxes. Works with Angular forms (a boolean) or on its own through `[(checked)]`.
 *
 * ```html
 * <ds-checkbox label="Accept terms" formControlName="terms" />
 * <ds-checkbox [(checked)]="all" [(indeterminate)]="some">Select all</ds-checkbox>
 * ```
 *
 * The label comes from `label` or the projected content. Inside a `ds-field`, the input takes
 * the field's id, description, error and states, so a field error can explain the checkbox.
 * Differences from React: the label can be projected content, and `indeterminate` is
 * two-way bindable because a click clears it.
 */
@Component({
  selector: 'ds-checkbox',
  imports: [IconComponent],
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // The name goes to the input, not to this wrapper element.
    '[attr.aria-label]': 'null',
    '[attr.data-disabled]': 'flag(isDisabled())',
  },
})
export class CheckboxComponent implements ControlValueAccessor, OnInit {
  /** Visible label. Projected content works too. */
  readonly label = input<string>();
  /** Whether the box is checked. Two-way bindable: `[(checked)]`. */
  readonly checked = model(false);
  /** Mixed state, announced as "mixed". Cleared when the box is clicked. Two-way bindable. */
  readonly indeterminate = model(false);
  /** Disables the checkbox. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the checkbox required. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Name for native form submission. */
  readonly name = input<string>();
  /** Value submitted with a native form when checked. @default 'on' */
  readonly value = input<string>();
  /** Id of the input. Generated when omitted; inside a `ds-field`, the field's id wins. */
  readonly inputId = input(uniqueId('ds-checkbox-'));
  /** Accessible name when there is no visible label. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  private readonly status = injectControlStatus(this);
  protected readonly field = injectFieldContext(() => this.inputId());
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(
    () => this.disabled() || this.formsDisabled() || this.field.disabled(),
  );
  protected readonly isRequired = computed(
    () => this.required() || this.status.required() || this.field.required(),
  );
  protected readonly flag = dataFlag;

  private onChange: (checked: boolean) => void = () => {};
  protected onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
    this.field.register(this.status);
  }

  protected handleChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.indeterminate.set(false);
    this.checked.set(checked);
    this.onChange(checked);
  }

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }
  registerOnChange(fn: (checked: boolean) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}
