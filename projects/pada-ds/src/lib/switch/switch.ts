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

/**
 * An on/off switch: a native checkbox with `role="switch"`. Works with Angular forms (a
 * boolean) or on its own through `[(checked)]`.
 *
 * ```html
 * <ds-switch label="Email notifications" formControlName="email" />
 * <ds-switch label="Sync" [(checked)]="sync" [loading]="saving()" />
 * ```
 *
 * `loading` shows a spinner in the knob, blocks interaction and sets `aria-busy`; use it while
 * an async change (a server-side preference) saves. Inside a `ds-field`, the input takes the
 * field's id, description and error. Differences from React: the label can be projected
 * content, and the loading spinner is drawn in CSS (no icon request).
 */
@Component({
  selector: 'ds-switch',
  templateUrl: './switch.html',
  styleUrl: './switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-label]': 'null',
  },
})
export class SwitchComponent implements ControlValueAccessor, OnInit {
  /** Visible label. Projected content works too. */
  readonly label = input<string>();
  /** Whether the switch is on. Two-way bindable: `[(checked)]`. */
  readonly checked = model(false);
  /** Shows a spinner in the knob and blocks interaction. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Disables the switch. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Name for native form submission. */
  readonly name = input<string>();
  /** Id of the input. Generated when omitted; inside a `ds-field`, the field's id wins. */
  readonly inputId = input(uniqueId('ds-switch-'));
  /** Accessible name when there is no visible label. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  private readonly status = injectControlStatus(this);
  protected readonly field = injectFieldContext(() => this.inputId());
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(
    () => this.disabled() || this.formsDisabled() || this.field.disabled(),
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
