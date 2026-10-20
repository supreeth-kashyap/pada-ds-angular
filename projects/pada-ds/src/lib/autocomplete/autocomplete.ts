import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import {
  ComboboxFilter,
  defaultComboboxFilter,
  DsComboboxParts,
  DsPresence,
  injectControlStatus,
  uniqueId,
} from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

export interface AutocompleteOption {
  value: string;
  label: string;
  /** Second line under the label. */
  description?: string;
  /** Built-in icon name. */
  icon?: string;
  disabled?: boolean;
}

/**
 * A text field with filtered suggestions (combobox): type to narrow the list, the arrow keys
 * move the highlight, Enter picks, Escape closes and then clears. With `multiple`, picks become
 * removable chips and Backspace in the empty input removes the last one. Works with Angular
 * forms (`formControlName`, `[(ngModel)]`: a `string | null`, or a `string[]` with
 * `multiple`) or on its own through `[(value)]` / `[(values)]`.
 *
 * ```html
 * <ds-autocomplete label="Assignee" [options]="people" name="assignee" formControlName="assignee" />
 * <ds-autocomplete label="Reviewers" [options]="people" multiple [(values)]="reviewers" />
 * ```
 *
 * Built on the headless `dsCombobox`. Differences from React: single and multiple selections
 * are two models (`value`, `values`) so both stay typed; the typed text is the `inputValue`
 * model (React's `onInputValueChange`); with a forms control, `error` shows only once the
 * control is invalid and touched, as in `ds-input-text`.
 */
@Component({
  selector: 'ds-autocomplete',
  imports: [DsComboboxParts, DsPresence, IconComponent],
  templateUrl: './autocomplete.html',
  styleUrl: './autocomplete.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteComponent implements ControlValueAccessor, OnInit {
  /** Visible label. */
  readonly label = input.required<string>();
  /** The suggestions. */
  readonly options = input.required<readonly AutocompleteOption[]>();
  readonly placeholder = input<string>();
  /** Help text under the field. */
  readonly description = input<string>();
  /** Error message; marks the field invalid. */
  readonly error = input<string>();
  /** Shown when nothing matches. @default 'No results' */
  readonly emptyMessage = input('No results');
  /** How options match the typed text; `false` for server-side search (filter the options yourself). */
  readonly filter = input<ComboboxFilter | false>(defaultComboboxFilter);
  /** Pick several options, shown as removable chips. */
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  /** Name for form submission (a hidden input per selected value). */
  readonly name = input<string>();
  /** Id of the input. Generated when omitted. */
  readonly inputId = input(uniqueId('ds-autocomplete-'));
  /** The selected value (single). Two-way bindable: `[(value)]`. */
  readonly value = model<string | null>(null);
  /** The selected values (with `multiple`). Two-way bindable: `[(values)]`. */
  readonly values = model<string[]>([]);
  /** The typed text, on every keystroke (e.g. to fetch options). Two-way bindable. */
  readonly inputValue = model('');

  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly isRequired = computed(() => this.required() || this.status.required());
  protected readonly invalid = computed(() =>
    this.status.ngControl ? this.status.invalid() : !!this.error(),
  );
  protected readonly descriptionId = computed(() => `${this.inputId()}-description`);
  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  protected readonly showError = computed(() => !!this.error() && this.invalid());
  protected readonly describedBy = computed(
    () =>
      [this.description() && this.descriptionId(), this.showError() && this.errorId()]
        .filter(Boolean)
        .join(' ') || null,
  );

  private readonly byValue = computed(
    () => new Map(this.options().map((option) => [option.value, option])),
  );
  /** Selection as a list, whatever the mode (chips and hidden inputs render from it). */
  protected readonly selection = computed<readonly string[]>(() => {
    if (this.multiple()) return this.values();
    const value = this.value();
    return value === null ? [] : [value];
  });
  protected readonly chips = computed(() =>
    this.multiple()
      ? this.values().map((value) => ({
          value,
          label: this.byValue().get(value)?.label ?? value,
        }))
      : [],
  );
  private readonly selectedLabel = computed(() => {
    const value = this.value();
    return value === null ? '' : (this.byValue().get(value)?.label ?? '');
  });
  protected readonly shownPlaceholder = computed(() =>
    this.multiple() && this.values().length > 0 ? null : (this.placeholder() ?? null),
  );

  private onChange: (value: string | string[] | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // A single selection shows its label in the input (also when set from outside).
    let previous: string | undefined;
    effect(() => {
      const label = this.selectedLabel();
      if (this.multiple() || (previous === undefined && label === '')) return;
      previous = label;
      untracked(() => this.inputValue.set(label));
    });
  }

  ngOnInit() {
    this.status.connect();
  }

  protected pickSingle(value: string | null) {
    this.value.set(value);
    this.onChange(value);
  }

  protected pickMultiple(values: string[]) {
    this.values.set(values);
    this.onChange(values);
  }

  protected remove(value: string) {
    this.pickMultiple(this.values().filter((entry) => entry !== value));
  }

  protected onKeyDown(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    if (this.multiple() && event.key === 'Backspace' && input.value === '') {
      const values = this.values();
      if (values.length > 0) this.pickMultiple(values.slice(0, -1));
    }
  }

  protected onBlur() {
    this.onTouched();
  }

  writeValue(value: string | string[] | null): void {
    if (this.multiple()) this.values.set(Array.isArray(value) ? value : []);
    else this.value.set(typeof value === 'string' ? value : null);
  }
  registerOnChange(fn: (value: string | string[] | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}
