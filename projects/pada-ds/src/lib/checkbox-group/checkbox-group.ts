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
import { dataFlag, DsField, injectControlStatus, uniqueId } from 'pada-ds-angular/headless';
import { CheckboxComponent } from '../checkbox/checkbox';

/** One choice in a `ds-checkbox-group`. */
export interface CheckboxGroupOption {
  /** The value added to the group's array when checked. */
  value: string;
  /** Visible label. */
  label: string;
  /** Disables this choice only. */
  disabled?: boolean;
}

export type CheckboxGroupOrientation = 'vertical' | 'horizontal';

/**
 * A labelled set of checkboxes whose value is the array of checked option values, with an
 * optional "Select all" box that turns mixed while only some are checked. Works with Angular
 * forms (`Validators.required` means at least one) or through `[(value)]`.
 *
 * ```html
 * <ds-checkbox-group
 *   label="Notify me about"
 *   description="We send at most one email a day."
 *   [options]="topics"
 *   selectAll
 *   formControlName="topics"
 * />
 * ```
 *
 * `role="group"` named by the label and described by `description` and `error`; each choice is
 * a `ds-checkbox`, so Tab moves between them and Space toggles. Select all only changes the
 * enabled choices. React has no CheckboxGroup yet: it is designed from the roadmap entry
 * ("Labelled group with select-all"). The choices come from `options` rather than projected
 * checkboxes, so `ds-checkbox` itself stays unchanged.
 */
@Component({
  selector: 'ds-checkbox-group',
  imports: [CheckboxComponent],
  template: `
    @if (label()) {
      <span class="checkbox-group-label" [id]="labelId">
        {{ label() }}
        @if (isRequired()) {
          <span class="checkbox-group-required" aria-hidden="true">*</span>
        }
      </span>
    }
    @if (description()) {
      <span class="checkbox-group-description" [id]="descriptionId">{{ description() }}</span>
    }
    <div class="checkbox-group-items">
      @if (selectAll()) {
        <ds-checkbox
          class="checkbox-group-select-all"
          [label]="selectAllLabel()"
          [checked]="allChecked()"
          [indeterminate]="someChecked()"
          [disabled]="selectAllDisabled()"
          (checkedChange)="setAll($event)"
        />
      }
      @for (item of items(); track item.value) {
        <ds-checkbox
          [label]="item.label"
          [checked]="item.checked"
          [disabled]="item.disabled"
          [name]="name()"
          [value]="item.value"
          (checkedChange)="toggle(item.value, $event)"
        />
      }
    </div>
    @if (error() && invalid()) {
      <span class="checkbox-group-error" [id]="errorId">{{ error() }}</span>
    }
  `,
  styleUrl: './checkbox-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The choices must not take a surrounding field's single control id; the group labels,
  // describes and reports errors itself.
  viewProviders: [{ provide: DsField, useValue: null }],
  host: {
    role: 'group',
    '[attr.aria-labelledby]': 'label() ? labelId : null',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-disabled]': 'flag(isDisabled())',
    '[attr.data-invalid]': 'flag(invalid())',
    '(focusout)': 'handleFocusOut($event)',
  },
})
export class CheckboxGroupComponent implements ControlValueAccessor, OnInit {
  /** The choices, in order. */
  readonly options = input.required<readonly CheckboxGroupOption[]>();
  /** The checked values. Two-way bindable: `[(value)]`. */
  readonly value = model<string[]>([]);
  /** Visible label; also the group's accessible name. Use `aria-label` without one. */
  readonly label = input<string>();
  /** Help text under the label. */
  readonly description = input<string>();
  /** Message shown (and announced) while the group is invalid and touched. */
  readonly error = input<string>();
  /** Adds a "Select all" box before the choices. */
  readonly selectAll = input(false, { transform: booleanAttribute });
  /** Label of the select-all box. @default 'Select all' */
  readonly selectAllLabel = input('Select all');
  /** Stacks the choices (`vertical`) or lays them in a wrapping row. @default 'vertical' */
  readonly orientation = input<CheckboxGroupOrientation>('vertical');
  /** Disables every choice. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the group required (at least one choice); shown next to the label. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Name for native form submission: each checked choice submits as `name=value`. */
  readonly name = input<string>();

  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly flag = dataFlag;
  protected readonly labelId = uniqueId('ds-checkbox-group-label-');
  protected readonly descriptionId = uniqueId('ds-checkbox-group-description-');
  protected readonly errorId = uniqueId('ds-checkbox-group-error-');

  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly isRequired = computed(() => this.required() || this.status.required());
  protected readonly invalid = computed(() => this.status.invalid());
  protected readonly items = computed(() => {
    const values = this.value();
    const disabled = this.isDisabled();
    return this.options().map((option) => ({
      value: option.value,
      label: option.label,
      checked: values.includes(option.value),
      disabled: disabled || !!option.disabled,
    }));
  });
  private readonly enabled = computed(() => this.items().filter((item) => !item.disabled));
  protected readonly allChecked = computed(() => {
    const enabled = this.enabled();
    return enabled.length > 0 && enabled.every((item) => item.checked);
  });
  protected readonly someChecked = computed(
    () => !this.allChecked() && this.enabled().some((item) => item.checked),
  );
  protected readonly selectAllDisabled = computed(() => this.enabled().length === 0);
  protected readonly describedBy = computed(
    () =>
      [
        this.description() && this.descriptionId,
        this.error() && this.invalid() && this.errorId,
      ]
        .filter(Boolean)
        .join(' ') || null,
  );

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
  }

  protected toggle(value: string, checked: boolean) {
    const values = this.value().filter((entry) => entry !== value);
    this.commit(checked ? [...values, value] : values);
  }

  protected setAll(checked: boolean) {
    const enabled = new Set(this.enabled().map((item) => item.value));
    // Keep the disabled choices as they are; order follows the options.
    const kept = this.value().filter((entry) => !enabled.has(entry));
    const added = checked ? this.options().filter((option) => enabled.has(option.value)) : [];
    this.commit([...kept, ...added.map((option) => option.value)]);
  }

  protected handleFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (!next || !(event.currentTarget as HTMLElement).contains(next)) this.onTouched();
  }

  private commit(values: string[]) {
    // Report values in option order, whatever order they were checked in.
    const order = this.options().map((option) => option.value);
    const sorted = [...values].sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
    });
    this.value.set(sorted);
    this.onChange(sorted);
  }

  writeValue(value: readonly string[] | null): void {
    this.value.set(value ? [...value] : []);
  }
  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}
