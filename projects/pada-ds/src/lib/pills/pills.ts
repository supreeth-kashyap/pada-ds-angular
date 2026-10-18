import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  viewChildren,
} from '@angular/core';
import { findNextIndex, keyToNavigation } from 'pada-ds-angular/headless';

export interface PillOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type PillsSize = 'sm' | 'md' | 'lg';

/**
 * A row of rounded, single-select pills for switching between views or filters.
 *
 * ```html
 * <ds-pills label="Period" [options]="periods" [(value)]="period" />
 * ```
 *
 * A tab list: arrow keys (and Home/End) move between pills and select as they go, wrapping
 * around and skipping disabled pills; only the selected pill is in the tab order. Without a
 * `value`, the first option is selected.
 *
 * Differences from React: `label` names the list (React always says "Pills navigation").
 */
@Component({
  selector: 'ds-pills',
  template: `
    @for (option of options(); track option.value; let index = $index) {
      <button
        #pill
        type="button"
        class="pill"
        role="tab"
        [attr.aria-selected]="option.value === selected()"
        [disabled]="disabled() || !!option.disabled"
        [tabIndex]="index === tabStop() ? 0 : -1"
        (click)="select(option)"
        (keydown)="onKeydown($event, index)"
      >
        {{ option.label }}
      </button>
    }
  `,
  styleUrl: './pills.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tablist',
    '[attr.aria-label]': 'label()',
    '[attr.data-size]': 'size()',
    '[attr.data-disabled]': 'disabled() ? "" : null',
  },
})
export class PillsComponent {
  /** The pills, in order. */
  readonly options = input.required<PillOption[]>();
  /** The selected option's value. Two-way bindable with `[(value)]`. */
  readonly value = model<string>();
  /** @default 'md' */
  readonly size = input<PillsSize>('md');
  /** Disables every pill. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible name of the list. @default 'Pills navigation' */
  readonly label = input('Pills navigation');

  private readonly pills = viewChildren<ElementRef<HTMLButtonElement>>('pill');

  protected readonly selected = computed(() => this.value() ?? this.options()[0]?.value);

  /** The selected pill, or the first enabled one when that is disabled. */
  protected readonly tabStop = computed(() => {
    if (this.disabled()) return -1;
    const options = this.options();
    const index = options.findIndex((option) => option.value === this.selected());
    return index >= 0 && !options[index].disabled ? index : findNextIndex(options, -1, 'first');
  });

  protected select(option: PillOption) {
    if (this.disabled() || option.disabled) return;
    this.value.set(option.value);
  }

  protected onKeydown(event: KeyboardEvent, index: number) {
    if (this.disabled()) return;
    const key = keyToNavigation(event.key, 'both');
    if (!key) return;
    event.preventDefault();
    const options = this.options();
    const next = findNextIndex(options, index, key, { loop: true });
    if (next < 0) return;
    this.select(options[next]);
    this.pills()[next]?.nativeElement.focus();
  }
}
