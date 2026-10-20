import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import {
  createTypeahead,
  DsPresence,
  injectControlStatus,
  uniqueId,
} from 'pada-ds-angular/headless';
import { ComboBoxComponent, ComboBoxItem, ComboBoxItemClick } from '../combo-box/combo-box';
import { IconComponent } from '../icon/icon';
import { SelectDropdownDirective } from './select-dropdown';
import { findEnabledIndex, findSelectTypeaheadIndex } from './select-navigation';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  /** Heading of the group the option belongs to. Consecutive options with the same group are grouped. */
  group?: string;
}

/**
 * A select-only combobox (WAI-ARIA APG): focus stays on the trigger while ArrowUp/ArrowDown,
 * Home/End and multi-letter type-ahead move through the options (`aria-activedescendant`);
 * Enter or Space picks, Escape and Tab close. The list floats in the top layer, flips above
 * the trigger when there is no room below, and is as wide as the trigger. With `name`, a hidden
 * input submits the value with native forms. Works with Angular forms (`formControlName`,
 * `[(ngModel)]`) or on its own through `[(value)]`.
 *
 * ```html
 * <ds-select label="Plan" name="plan" [options]="plans" formControlName="plan" />
 * <ds-select label="Fruit" [options]="fruit" [(value)]="fruit" (selectionChange)="log($event)" />
 * ```
 *
 * Differences from React: `onChange(value, option)` is `[(value)]` plus `selectionChange`
 * (the picked option); the list stays in place in the DOM (top layer through
 * `popover="manual"`) instead of a portal; options can be grouped under headings through
 * `group`; with a forms control, `error` shows only once the control is invalid and touched.
 */
@Component({
  selector: 'ds-select',
  imports: [ComboBoxComponent, DsPresence, IconComponent, SelectDropdownDirective],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent implements ControlValueAccessor, OnInit {
  /** Visible label; also names the listbox. */
  readonly label = input.required<string>();
  /** The options, in order. */
  readonly options = input.required<readonly SelectOption[]>();
  /** The selected value. Two-way bindable: `[(value)]`. */
  readonly value = model<string | number | null>(null);
  /** Shown when no value is selected. @default 'Select an option' */
  readonly placeholder = input('Select an option');
  /** Help text under the trigger. */
  readonly description = input<string>();
  /** Error message; marks the trigger invalid. */
  readonly error = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Name for native form submission, through a hidden input. */
  readonly name = input<string>();
  /** Id of the trigger. Defaults to `name`, else a generated id. */
  readonly id = input<string>();
  /** The user picked an option; receives the whole option. */
  readonly selectionChange = output<SelectOption>();

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly list = viewChild(SelectDropdownDirective, { read: ElementRef });
  private readonly generatedId = uniqueId('ds-select-');
  protected readonly triggerId = computed(() => this.id() || this.name() || this.generatedId);
  protected readonly labelId = computed(() => `${this.triggerId()}-label`);
  protected readonly listboxId = computed(() => `${this.triggerId()}-listbox`);
  protected readonly descriptionId = computed(() => `${this.triggerId()}-description`);
  protected readonly errorId = computed(() => `${this.triggerId()}-error`);

  protected readonly open = signal(false);
  /** The option the trigger points at through aria-activedescendant. */
  protected readonly activeIndex = signal(-1);

  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly invalid = computed(() =>
    this.status.ngControl ? this.status.invalid() : !!this.error(),
  );
  protected readonly showError = computed(() => !!this.error() && this.invalid());
  protected readonly describedBy = computed(
    () =>
      [this.description() && this.descriptionId(), this.showError() && this.errorId()]
        .filter(Boolean)
        .join(' ') || null,
  );

  private readonly selectedIndex = computed(() =>
    this.options().findIndex((option) => option.value === this.value()),
  );
  protected readonly selectedOption = computed(() => this.options()[this.selectedIndex()]);
  protected readonly displayText = computed(
    () => this.selectedOption()?.label || this.placeholder(),
  );
  protected readonly activeDescendant = computed(() =>
    this.open() && this.activeIndex() >= 0
      ? `${this.listboxId()}-option-${this.activeIndex()}`
      : null,
  );
  protected readonly items = computed<ComboBoxItem[]>(() =>
    this.options().map((option, index) => ({
      id: String(option.value),
      label: option.label,
      selected: option.value === this.value(),
      disabled: option.disabled,
      active: index === this.activeIndex(),
      group: option.group,
    })),
  );
  private readonly navigable = computed(() =>
    this.options().map((option) => ({ label: option.label, disabled: option.disabled })),
  );

  private readonly typeahead = createTypeahead();
  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Keep the active option visible while arrowing through a long list.
    afterRenderEffect(() => {
      const index = this.activeIndex();
      if (!this.open() || index < 0) return;
      document
        .getElementById(`${this.listboxId()}-option-${index}`)
        ?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  ngOnInit() {
    this.status.connect();
  }

  private openList(index: number) {
    this.activeIndex.set(index);
    this.open.set(true);
  }

  /** Opening starts on the selected option, or the first enabled one. */
  private openOnSelection() {
    const selected = this.selectedOption();
    this.openList(
      selected && !selected.disabled
        ? this.selectedIndex()
        : findEnabledIndex(this.navigable(), -1, 'Home'),
    );
  }

  protected close() {
    this.open.set(false);
  }

  private commit(option: SelectOption | undefined) {
    if (!option || option.disabled) return;
    this.value.set(option.value);
    this.onChange(option.value);
    this.selectionChange.emit(option);
    this.open.set(false);
    this.trigger().nativeElement.focus();
  }

  protected onClick() {
    if (this.open()) this.close();
    else this.openOnSelection();
  }

  protected onItemClick({ index }: ComboBoxItemClick) {
    this.commit(this.options()[index]);
  }

  protected onKeyDown(event: KeyboardEvent) {
    const { key } = event;
    // Printable keys build a search ("bl" finds Blackberry); Space only searches mid-word.
    const search = this.typeahead(event);
    const options = this.navigable();

    if (!this.open()) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        event.preventDefault();
        this.openOnSelection();
      } else if (key === 'Home' || key === 'End') {
        event.preventDefault();
        this.openList(findEnabledIndex(options, -1, key));
      } else if (search !== null) {
        this.openList(findSelectTypeaheadIndex(options, this.selectedIndex(), search));
      }
      return;
    }

    if (search !== null) {
      event.preventDefault();
      this.activeIndex.set(findSelectTypeaheadIndex(options, this.activeIndex(), search));
      return;
    }

    switch (key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Home':
      case 'End':
        event.preventDefault();
        this.activeIndex.set(findEnabledIndex(options, this.activeIndex(), key));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.commit(this.options()[this.activeIndex()]);
        break;
      case 'Escape':
        // Only close the listbox, not an enclosing dialog.
        event.preventDefault();
        event.stopPropagation();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  protected onBlur(event: FocusEvent) {
    // Leaving the trigger for anything but the list (Tab, a click elsewhere) closes it.
    const list: HTMLElement | undefined = this.list()?.nativeElement;
    if (list?.contains(event.relatedTarget as Node | null)) return;
    this.close();
    this.onTouched();
  }

  writeValue(value: string | number | null): void {
    this.value.set(value ?? null);
  }
  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}
