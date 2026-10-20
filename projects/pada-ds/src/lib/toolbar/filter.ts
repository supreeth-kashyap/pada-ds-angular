import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import {
  DsPopover,
  DsPopoverContent,
  DsPopoverTrigger,
  DsPresence,
  DsToolbarItem,
  DsVisuallyHidden,
} from 'pada-ds-angular/headless';
import { ButtonComponent } from '../button/button';
import { ComboBoxComponent, ComboBoxItem } from '../combo-box/combo-box';
import { IconComponent } from '../icon/icon';

/** One option of a `ds-filter` (or of a `ds-more-filter` filter). */
export interface FilterOption {
  value: string;
  label: string;
  /** Built-in icon name shown before the label. */
  iconName?: string;
  disabled?: boolean;
}

/** What `ds-filter` reports when its selection commits. */
export interface FilterChange {
  value: string[];
  /** The selected options. */
  options: FilterOption[];
}

/**
 * A toolbar chip that opens a list of options in a popover. The chip shows how many options are
 * selected. Inside a `ds-toolbar` it takes part in the toolbar's arrow-key focus.
 *
 * Single select: picking an option commits it and closes the popover, returning focus to the
 * chip. Multi select (`multiSelect`): picks are staged and commit on Apply; Escape or an outside
 * click discards them. In the popover, the arrow keys move between options.
 *
 * ```html
 * <ds-filter label="Status" [options]="statuses" [(value)]="status" />
 * <ds-filter label="Owner" [options]="owners" multiSelect (filterChange)="load($event.value)" />
 * ```
 *
 * Differences from React: the selection is `[(value)]` (React's `value` / `defaultValue`), and
 * `onChange(values, options)` is `filterChange` with `{ value, options }`.
 */
@Component({
  selector: 'ds-filter',
  imports: [
    ButtonComponent,
    ComboBoxComponent,
    DsPopover,
    DsPopoverContent,
    DsPopoverTrigger,
    DsPresence,
    DsToolbarItem,
    DsVisuallyHidden,
    IconComponent,
  ],
  template: `
    <ng-container dsPopover [open]="open()" (openChange)="setOpen($event)">
      <button
        dsPopoverTrigger
        dsToolbarItem
        class="filter-trigger"
        [attr.data-active]="count() > 0 ? '' : null"
        [attr.data-open]="open() ? '' : null"
        [disabled]="disabled()"
      >
        <span class="filter-trigger-label">{{ label() }}</span>
        @if (count() > 0) {
          <span class="filter-trigger-badge"
            >{{ count() }}<span dsVisuallyHidden> selected</span></span
          >
        } @else {
          <span class="filter-trigger-dash" aria-hidden="true"></span>
        }
        <ds-icon name="chevron_down" class="filter-trigger-chevron" [size]="12" />
      </button>
      <div
        *dsPresence="open()"
        dsPopoverContent
        class="filter-popover"
        side="bottom"
        align="start"
        [sideOffset]="4"
        [attr.aria-label]="label()"
      >
        <ds-combo-box
          class="filter-list"
          [items]="items()"
          [multiSelect]="multiSelect()"
          [attr.aria-label]="label()"
          (itemClick)="pick($event.item)"
        />
        @if (multiSelect()) {
          <div class="filter-footer">
            <button dsButton variant="ghost" (click)="clear()">{{ clearLabel() }}</button>
            <button dsButton variant="primary" (click)="apply()">{{ applyLabel() }}</button>
          </div>
        }
      </div>
    </ng-container>
  `,
  styleUrls: ['./filter-trigger.scss', './filter.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent {
  /** Label on the chip, e.g. "Status". Also names the popover and its list. */
  readonly label = input.required<string>();
  /** The options. */
  readonly options = input.required<readonly FilterOption[]>();
  /** Several options can be picked; they commit on Apply. */
  readonly multiSelect = input(false, { transform: booleanAttribute });
  /** The committed selection (single select holds at most one value). Two-way bindable. */
  readonly value = model<readonly string[]>([]);
  /** @default 'Apply' */
  readonly applyLabel = input('Apply');
  /** @default 'Clear' */
  readonly clearLabel = input('Clear');
  /** Disables the chip. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The selection committed: on every pick (single) or on Apply (multi). */
  readonly filterChange = output<FilterChange>();

  protected readonly open = signal(false);
  /** Picks staged while a multi-select popover is open. */
  private readonly draft = signal<readonly string[]>([]);
  protected readonly count = computed(() => this.value().length);

  protected readonly items = computed<ComboBoxItem[]>(() => {
    const active = this.multiSelect() ? this.draft() : this.value();
    return this.options().map((option) => ({
      id: option.value,
      label: option.label,
      iconName: option.iconName,
      disabled: option.disabled,
      selected: active.includes(option.value),
    }));
  });

  /** Opening starts the draft from the committed value; closing without Apply discards it. */
  protected setOpen(open: boolean) {
    if (open) this.draft.set(this.value());
    this.open.set(open);
  }

  protected pick(item: ComboBoxItem) {
    if (this.multiSelect()) {
      this.draft.update((draft) =>
        draft.includes(item.id) ? draft.filter((value) => value !== item.id) : [...draft, item.id],
      );
      return;
    }
    this.commit([item.id]);
    this.open.set(false);
  }

  protected apply() {
    this.commit(this.draft());
    this.open.set(false);
  }

  protected clear() {
    this.draft.set([]);
  }

  private commit(next: readonly string[]) {
    const value = [...next];
    this.value.set(value);
    this.filterChange.emit({
      value,
      options: this.options().filter((option) => value.includes(option.value)),
    });
  }
}
