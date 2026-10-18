import {
  booleanAttribute,
  computed,
  Directive,
  inject,
  input,
  OnDestroy,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import { dataFlag } from '../utils/dom';
import { ControlStatus, injectControlStatus } from '../utils/forms';
import { uniqueId } from '../utils/id';

/**
 * Wires a label, a control, a description and an error together: ids, `for`,
 * `aria-describedby`, `aria-invalid`, `required` and `disabled`, for any control. With an
 * Angular forms control on the `dsFieldControl` element, `invalid`, `required` and `disabled`
 * follow it unless you set them.
 *
 * ```html
 * <div dsField>
 *   <label dsFieldLabel>Email</label>
 *   <input dsFieldControl type="email" formControlName="email" />
 *   <p dsFieldDescription>We never share it.</p>
 *   <p dsFieldError>Enter a valid email address.</p>
 * </div>
 * ```
 */
@Directive({
  selector: '[dsField]',
  exportAs: 'dsField',
  host: {
    '[attr.data-invalid]': 'flag(isInvalid())',
    '[attr.data-disabled]': 'flag(isDisabled())',
  },
})
export class DsField {
  /** Marks the control invalid (`aria-invalid`) and shows the error. Follows the forms control when unset. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Marks the control required. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Disables the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Id for the control. Generated when omitted. */
  readonly controlId = input<string>(uniqueId('ds-field-'));

  readonly descriptionId = computed(() => `${this.controlId()}-description`);
  readonly errorId = computed(() => `${this.controlId()}-error`);
  readonly hasDescription = signal(false);
  /** Whether the error part is shown, registered by `dsFieldError`. */
  readonly errorShown = signal<Signal<boolean> | null>(null);
  readonly hasError = computed(() => this.errorShown()?.() ?? false);

  /** The forms control state of the `dsFieldControl` element, registered by it. */
  readonly controlStatus = signal<ControlStatus | null>(null);

  readonly isInvalid = computed(() => this.invalid() ?? this.controlStatus()?.invalid() ?? false);
  readonly isRequired = computed(() => this.required() || !!this.controlStatus()?.required());
  readonly isDisabled = computed(() => this.disabled() || !!this.controlStatus()?.disabled());

  protected readonly flag = dataFlag;
}

/** `undefined` stays undefined ("not set"); anything else is a boolean attribute. */
function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined || value === null ? undefined : booleanAttribute(value);
}

/** The control's label. */
@Directive({
  selector: '[dsFieldLabel]',
  host: {
    '[attr.for]': 'field.controlId()',
    '[attr.data-disabled]': 'flag(field.isDisabled())',
  },
})
export class DsFieldLabel {
  protected readonly field = inject(DsField);
  protected readonly flag = dataFlag;
}

/**
 * The control (an input, a textarea, a select, or a custom control). Gets the id, the
 * description and error wiring, `aria-invalid`, `required` and `disabled`.
 */
@Directive({
  selector: '[dsFieldControl]',
  host: {
    '[id]': 'field.controlId()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'field.isInvalid() ? "true" : null',
    '[attr.required]': 'field.isRequired() ? "" : null',
    '[attr.disabled]': 'field.isDisabled() ? "" : null',
  },
})
export class DsFieldControl implements OnInit, OnDestroy {
  protected readonly field = inject(DsField);
  private readonly status = injectControlStatus();

  protected readonly describedBy = computed(
    () =>
      [
        this.field.hasDescription() && this.field.descriptionId(),
        this.field.hasError() && this.field.errorId(),
      ]
        .filter(Boolean)
        .join(' ') || null,
  );

  ngOnInit() {
    // The forms control's state reaches the field, so the label and error follow it too.
    this.status.connect();
    this.field.controlStatus.set(this.status);
  }

  ngOnDestroy() {
    if (this.field.controlStatus() === this.status) this.field.controlStatus.set(null);
  }
}

/** Help text under the control. */
@Directive({
  selector: '[dsFieldDescription]',
  host: { '[id]': 'field.descriptionId()' },
})
export class DsFieldDescription implements OnInit, OnDestroy {
  protected readonly field = inject(DsField);
  ngOnInit() {
    this.field.hasDescription.set(true);
  }
  ngOnDestroy() {
    this.field.hasDescription.set(false);
  }
}

/**
 * The validation message: shown (`role="alert"`, so it is announced) only while the field is
 * invalid, hidden otherwise. Set `forceShow` to keep it visible.
 */
@Directive({
  selector: '[dsFieldError]',
  host: {
    role: 'alert',
    '[id]': 'field.errorId()',
    '[hidden]': '!shown()',
  },
})
export class DsFieldError implements OnInit, OnDestroy {
  protected readonly field = inject(DsField);
  /** Show the message even when the field is valid. */
  readonly forceShow = input(false, { transform: booleanAttribute });
  protected readonly shown = computed(() => this.field.isInvalid() || this.forceShow());

  ngOnInit() {
    // The control only points at the message while it is shown.
    this.field.errorShown.set(this.shown);
  }

  ngOnDestroy() {
    if (this.field.errorShown() === this.shown) this.field.errorShown.set(null);
  }
}

/** Every field part, for `imports: [DsFieldParts]`. */
export const DsFieldParts = [
  DsField,
  DsFieldLabel,
  DsFieldControl,
  DsFieldDescription,
  DsFieldError,
] as const;
