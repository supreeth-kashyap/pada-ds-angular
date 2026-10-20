import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  OnInit,
  signal,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import {
  dataFlag,
  findNextIndex,
  focusElement,
  injectControlStatus,
  keyToNavigation,
} from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

/** One segment of a `ds-segment-control`. */
export interface SegmentOption {
  value: string;
  label?: string;
  /** Built-in icon name. */
  icon?: string;
  /** Accessible name for an icon-only segment. */
  ariaLabel?: string;
  disabled?: boolean;
}

/**
 * A compact single choice between a few views or modes, as a row of segments (`role="tablist"`
 * with `role="tab"` segments). Selection follows focus: arrow keys move and select, wrapping
 * and skipping disabled segments. Works with Angular forms (a string) or through `[(value)]`.
 *
 * ```html
 * <ds-segment-control [options]="views" [(value)]="view" aria-label="View" />
 * ```
 *
 * Until a value is set the first segment shows as selected. Differences from React: Home and
 * End jump to the first and last segments, arrows skip disabled segments instead of stopping,
 * and icon-only segments take an `ariaLabel`.
 */
@Component({
  selector: 'ds-segment-control',
  imports: [IconComponent],
  templateUrl: './segment-control.html',
  styleUrl: './segment-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-label]': 'null',
    '[attr.data-disabled]': 'flag(isDisabled())',
  },
})
export class SegmentControlComponent implements ControlValueAccessor, OnInit {
  /** The segments. */
  readonly options = input.required<readonly SegmentOption[]>();
  /** The selected segment's value. Two-way bindable: `[(value)]`. */
  readonly value = model<string | null>(null);
  /** Accessible name of the control. @default 'Segment control' */
  readonly ariaLabel = input('Segment control', { alias: 'aria-label' });
  /** Disables every segment. */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  /** The value shown as selected: the value, or the first segment's. */
  protected readonly selected = computed(() => this.value() ?? this.options()[0]?.value ?? null);
  protected readonly flag = dataFlag;

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  ngOnInit() {
    this.status.connect();
  }

  protected select(option: SegmentOption) {
    if (this.isDisabled() || option.disabled) return;
    if (option.value !== this.value()) {
      this.value.set(option.value);
      this.onChange(option.value);
    }
  }

  protected handleKeydown(event: KeyboardEvent, index: number) {
    if (this.isDisabled() || event.key === 'PageUp' || event.key === 'PageDown') return;
    const step = keyToNavigation(event.key, 'both');
    if (!step) return;
    const options = this.options();
    const items = options.map((option) => ({
      label: option.label ?? '',
      disabled: !!option.disabled,
    }));
    const next = findNextIndex(items, index, step, { loop: true });
    if (next === -1) return;
    event.preventDefault();
    this.select(options[next]);
    focusElement(this.element.querySelector<HTMLElement>(`[data-index="${next}"]`));
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
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
