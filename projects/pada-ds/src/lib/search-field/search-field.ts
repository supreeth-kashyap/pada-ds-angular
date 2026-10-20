import {
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
import { injectControlStatus } from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

/**
 * A compact search input with a leading search icon and a clear button that shows once there
 * is text. Escape clears the text too. Works with Angular forms or on its own through
 * `[(value)]`.
 *
 * ```html
 * <ds-search-field placeholder="Search members" [(value)]="query" (cleared)="reset()" />
 * ```
 *
 * Differences from React: Escape clears (React only clears from the button), and clearing
 * moves focus back to the input, since the clear button disappears.
 */
@Component({
  selector: 'ds-search-field',
  imports: [IconComponent],
  templateUrl: './search-field.html',
  styleUrl: './search-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFieldComponent implements ControlValueAccessor, OnInit {
  /** The search text. Two-way bindable: `[(value)]`. */
  readonly value = model('');
  /** @default 'Search' */
  readonly placeholder = input('Search');
  /** Accessible name of the input. @default 'Search' */
  readonly ariaLabel = input('Search', { alias: 'aria-label' });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Id of the input. */
  readonly inputId = input<string>();
  /** The text was cleared with the clear button or Escape. */
  readonly cleared = output<void>();

  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly empty = computed(() => this.value().length === 0);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
  }

  protected onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value);
  }

  protected clear() {
    this.value.set('');
    this.onChange('');
    this.cleared.emit();
    this.inputRef().nativeElement.focus();
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || this.empty() || event.defaultPrevented) return;
    event.preventDefault();
    this.clear();
  }

  protected onBlur() {
    this.onTouched();
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
