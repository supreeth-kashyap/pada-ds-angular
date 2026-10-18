import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  DsField,
  DsFieldControl,
  DsFieldDescription,
  DsFieldError,
  DsFieldLabel,
} from 'pada-ds-angular/headless';

/**
 * A form field: label, control, description and error, wired for assistive technology. With
 * an Angular forms control on the `dsFieldControl` element, the invalid, required and disabled
 * states follow it.
 *
 * ```html
 * <ds-field>
 *   <ds-field-label>Email</ds-field-label>
 *   <input dsInput dsFieldControl type="email" formControlName="email" />
 *   <ds-field-description>We never share it.</ds-field-description>
 *   <ds-field-error>Enter a valid email address.</ds-field-error>
 * </ds-field>
 * ```
 */
@Component({
  selector: 'ds-field',
  template: '<ng-content />',
  styleUrl: './field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: DsField, inputs: ['invalid', 'required', 'disabled', 'controlId'] },
  ],
})
export class FieldComponent {}

/** The label. Required fields show an asterisk (hidden from screen readers: the control is `required`). */
@Component({
  selector: 'ds-field-label',
  imports: [DsFieldLabel],
  template: `
    <label dsFieldLabel class="field-label">
      <ng-content />
      @if (field.isRequired()) {
        <span class="field-required" aria-hidden="true">*</span>
      }
      @if (optional()) {
        <span class="field-optional">(optional)</span>
      }
    </label>
  `,
  styleUrl: './field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class FieldLabelComponent {
  protected readonly field = inject(DsField);
  /** Show "(optional)" after the label. */
  readonly optional = input(false, { transform: booleanAttribute });
}

/** Help text under the control. */
@Component({
  selector: 'ds-field-description',
  template: '<ng-content />',
  styleUrl: './field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DsFieldDescription],
  host: { class: 'field-description' },
})
export class FieldDescriptionComponent {}

/** Validation message, shown (and announced) while the field is invalid. */
@Component({
  selector: 'ds-field-error',
  template: '<ng-content />',
  styleUrl: './field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsFieldError, inputs: ['forceShow'] }],
  host: { class: 'field-error' },
})
export class FieldErrorComponent {}

/**
 * A styled text input or textarea. Inside a `ds-field`, add `dsFieldControl` to wire it up.
 *
 * ```html
 * <input dsInput dsFieldControl formControlName="name" />
 * ```
 */
@Component({
  selector: 'input[dsInput], textarea[dsInput]',
  template: '',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent {}

/** Every field part, including the headless control directive. */
export const FieldParts = [
  FieldComponent,
  FieldLabelComponent,
  FieldDescriptionComponent,
  FieldErrorComponent,
  InputComponent,
  DsFieldControl,
] as const;

export { DsFieldControl };
