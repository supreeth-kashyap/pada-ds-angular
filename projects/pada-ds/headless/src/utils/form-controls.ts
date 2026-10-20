// Helpers shared by the form controls (Slider, NumberInput, PinInput and the styled controls
// built on them): clamping, hidden inputs for native form submission, and wiring a custom
// control to a surrounding `dsField`.
import {
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Renderer2,
  type Signal,
} from '@angular/core';
import { DsField } from '../field/field.directive';
import type { ControlStatus } from './forms';

/** `value` limited to `low`…`high`. */
export const clamp = (value: number, low: number, high: number): number =>
  Math.min(high, Math.max(low, value));

/**
 * Keeps `<input type="hidden">` elements at the end of the host, one per value, so a control
 * without a native input still submits with a plain `<form>` (as `name`, repeated for several
 * values). Nothing is rendered while `name` is unset. Call it in an injection context.
 */
export function injectHiddenInputs(
  state: () => { name: string | undefined; values: readonly string[]; disabled: boolean },
) {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const renderer = inject(Renderer2);
  const inputs: HTMLInputElement[] = [];
  effect(() => {
    const { name, values, disabled } = state();
    const wanted = name ? values : [];
    while (inputs.length > wanted.length) renderer.removeChild(host, inputs.pop());
    while (inputs.length < wanted.length) {
      const input = renderer.createElement('input') as HTMLInputElement;
      renderer.setAttribute(input, 'type', 'hidden');
      renderer.appendChild(host, input);
      inputs.push(input);
    }
    inputs.forEach((input, index) => {
      renderer.setProperty(input, 'name', name);
      renderer.setProperty(input, 'value', wanted[index]);
      renderer.setProperty(input, 'disabled', disabled);
    });
  });
}

/** What a custom control needs from the `dsField` (or `ds-field`) around it, if there is one. */
export interface FieldContext {
  /** The surrounding field, or null. */
  readonly field: DsField | null;
  /** The field's control id (its label points at it), or the control's own id. */
  readonly controlId: Signal<string>;
  /** Ids of the field's description and shown error, for `aria-describedby`. */
  readonly describedBy: Signal<string | null>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  /**
   * Shares the control's Angular forms state with the field (so its label and error follow it),
   * as `dsFieldControl` does for native controls. Call it from `ngOnInit`.
   */
  register(status: ControlStatus): void;
}

/**
 * Wires a custom control (a component that renders its own input, or a `role="slider"`) to the
 * `dsField` around it, like `dsFieldControl` wires a native one: the field's id, description
 * and error ids, and its invalid, required and disabled states. Without a field, every signal
 * is neutral and `controlId` is `ownId`. Call it in an injection context.
 */
export function injectFieldContext(ownId: () => string): FieldContext {
  const field = inject(DsField, { optional: true });
  const destroyRef = inject(DestroyRef);
  return {
    field,
    controlId: computed(() => (field ? field.controlId() : ownId())),
    describedBy: computed(() =>
      field
        ? [field.hasDescription() && field.descriptionId(), field.hasError() && field.errorId()]
            .filter(Boolean)
            .join(' ') || null
        : null,
    ),
    invalid: computed(() => field?.isInvalid() ?? false),
    required: computed(() => field?.isRequired() ?? false),
    disabled: computed(() => field?.isDisabled() ?? false),
    register(status) {
      if (!field || !status.ngControl) return;
      field.controlStatus.set(status);
      destroyRef.onDestroy(() => {
        if (field.controlStatus() === status) field.controlStatus.set(null);
      });
    },
  };
}
