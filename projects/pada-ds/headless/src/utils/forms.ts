import { computed, DestroyRef, inject, signal } from '@angular/core';
import { ControlValueAccessor, NgControl, Validators } from '@angular/forms';

/**
 * The state of the Angular forms control (`formControl`, `formControlName`, `ngModel`) on the
 * same element, as signals: `invalid` (only once touched or edited, so untouched forms do not
 * shout), `disabled` and `required`. Every signal is false when there is no forms control.
 *
 * Pass the component itself as `accessor` to make it the control's value accessor. Components
 * that do this must not also provide `NG_VALUE_ACCESSOR` (the injection would be circular).
 *
 * Call `connect()` from `ngOnInit`: the forms directive only binds its control after construction.
 */
export function injectControlStatus(accessor?: ControlValueAccessor) {
  const ngControl = inject(NgControl, { self: true, optional: true });
  if (ngControl && accessor) ngControl.valueAccessor = accessor;
  const destroyRef = inject(DestroyRef);
  const version = signal(0);
  const read = <T>(fn: (control: NonNullable<NgControl['control']>) => T, fallback: T) =>
    computed(() => {
      version();
      const control = ngControl?.control;
      return control ? fn(control) : fallback;
    });

  return {
    ngControl,
    invalid: read((control) => control.invalid && (control.touched || control.dirty), false),
    disabled: read((control) => control.disabled, false),
    required: read((control) => control.hasValidator(Validators.required), false),
    /** Starts following the control. Call it from `ngOnInit`. */
    connect() {
      const subscription = ngControl?.control?.events.subscribe(() => version.update((v) => v + 1));
      destroyRef.onDestroy(() => subscription?.unsubscribe());
      version.update((v) => v + 1);
    },
  };
}

export type ControlStatus = ReturnType<typeof injectControlStatus>;
