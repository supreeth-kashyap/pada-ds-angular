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
  DsTabs,
  DsTabsContent,
  DsTabsList,
  DsTabsTrigger,
  DsToolbarItem,
  DsVisuallyHidden,
} from 'pada-ds-angular/headless';
import { ButtonComponent } from '../button/button';
import { ComboBoxComponent, ComboBoxItem } from '../combo-box/combo-box';
import { IconComponent } from '../icon/icon';
import type { FilterOption } from './filter';

/** One filter behind a `ds-more-filter` chip. */
export interface MoreFilterDescriptor {
  /** Stable id, the key in the values map. */
  id: string;
  /** Name in the list of filters. */
  label: string;
  /** Options shown when this filter is active. */
  options: FilterOption[];
  /** Pick several options. @default true */
  multiSelect?: boolean;
}

/** Selected option values per filter id. */
export type MoreFilterValues = Record<string, string[]>;

/** What `ds-more-filter` reports on Apply. */
export interface MoreFilterChange {
  value: MoreFilterValues;
  /** Selected options across all filters. */
  count: number;
}

const countSelections = (values: MoreFilterValues) =>
  Object.values(values).reduce((sum, list) => sum + (list?.length ?? 0), 0);

/**
 * One chip for the filters that do not fit the toolbar. Its popover lists the filters as
 * vertical tabs (Up/Down move between them; hovering one shows it too), each with its options
 * as a list; picks are staged across filters and commit together on Apply. Escape or an
 * outside click discards them. The chip shows the total number of selected options.
 *
 * ```html
 * <ds-more-filter [filters]="filters" [(value)]="values" (filterChange)="load($event.value)" />
 * ```
 *
 * Differences from React: the values map is `[(value)]` (React's `value` / `defaultValue`), and
 * `onChange(values, count)` is `filterChange` with `{ value, count }`.
 */
@Component({
  selector: 'ds-more-filter',
  imports: [
    ButtonComponent,
    ComboBoxComponent,
    DsPopover,
    DsPopoverContent,
    DsPopoverTrigger,
    DsPresence,
    DsTabs,
    DsTabsContent,
    DsTabsList,
    DsTabsTrigger,
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
        class="more-filter-popover"
        side="bottom"
        align="start"
        [sideOffset]="4"
        [attr.aria-label]="menuLabel()"
      >
        <div
          dsTabs
          class="more-filter-tabs"
          orientation="vertical"
          [value]="activeId()"
          (valueChange)="activeId.set($event)"
        >
          <div dsTabsList class="more-filter-primary" [attr.aria-label]="menuLabel()">
            @for (filter of rows(); track filter.id) {
              <button
                dsTabsTrigger
                class="more-filter-row"
                [value]="filter.id"
                (mouseenter)="activeId.set(filter.id)"
              >
                <span class="more-filter-row-label">{{ filter.label }}</span>
                @if (filter.count > 0) {
                  <span class="more-filter-row-count">
                    {{ filter.count }}<span dsVisuallyHidden> selected</span>
                  </span>
                }
                <ds-icon name="chevron_right" class="more-filter-row-chevron" [size]="12" />
              </button>
            }
          </div>
          <div class="more-filter-submenu">
            @for (filter of rows(); track filter.id) {
              <div dsTabsContent class="more-filter-panel" [value]="filter.id">
                <ds-combo-box
                  class="more-filter-list"
                  [items]="filter.items"
                  [multiSelect]="filter.multiSelect"
                  [attr.aria-label]="filter.label"
                  (itemClick)="pick(filter.id, filter.multiSelect, $event.item)"
                />
              </div>
            }
            <div class="filter-footer">
              <button dsButton variant="ghost" (click)="clear()">{{ clearLabel() }}</button>
              <button dsButton variant="primary" (click)="apply()">{{ applyLabel() }}</button>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styleUrls: ['./filter-trigger.scss', './more-filter.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoreFilterComponent {
  /** Label on the chip. @default 'More' */
  readonly label = input('More');
  /** The filters behind the chip. */
  readonly filters = input.required<readonly MoreFilterDescriptor[]>();
  /** The committed selections, per filter id. Two-way bindable. */
  readonly value = model<MoreFilterValues>({});
  /** @default 'Apply' */
  readonly applyLabel = input('Apply');
  /** @default 'Clear all' */
  readonly clearLabel = input('Clear all');
  /** Disables the chip. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The selections committed (on Apply). */
  readonly filterChange = output<MoreFilterChange>();

  protected readonly open = signal(false);
  protected readonly activeId = signal('');
  /** Picks staged while the popover is open. */
  private readonly draft = signal<MoreFilterValues>({});
  protected readonly count = computed(() => countSelections(this.value()));
  protected readonly menuLabel = computed(() => `${this.label()} filters`);

  protected readonly rows = computed(() => {
    const draft = this.draft();
    return this.filters().map((filter) => {
      const selected = draft[filter.id] ?? [];
      return {
        id: filter.id,
        label: filter.label,
        count: selected.length,
        multiSelect: filter.multiSelect ?? true,
        items: filter.options.map(
          (option): ComboBoxItem => ({
            id: option.value,
            label: option.label,
            iconName: option.iconName,
            disabled: option.disabled,
            selected: selected.includes(option.value),
          }),
        ),
      };
    });
  });

  /**
   * Opening starts the draft from the committed values (closing without Apply discards it) and
   * goes back to the first filter if the active one is gone.
   */
  protected setOpen(open: boolean) {
    if (open) {
      this.draft.set(this.value());
      const filters = this.filters();
      if (!filters.some((filter) => filter.id === this.activeId()))
        this.activeId.set(filters[0]?.id ?? '');
    }
    this.open.set(open);
  }

  protected pick(filterId: string, multiSelect: boolean, item: ComboBoxItem) {
    this.draft.update((draft) => {
      const current = draft[filterId] ?? [];
      const next = multiSelect
        ? current.includes(item.id)
          ? current.filter((value) => value !== item.id)
          : [...current, item.id]
        : [item.id];
      return { ...draft, [filterId]: next };
    });
  }

  protected apply() {
    // Filters with nothing picked are left out of the map.
    const value = Object.fromEntries(
      Object.entries(this.draft()).filter(([, selected]) => selected.length > 0),
    );
    this.value.set(value);
    this.filterChange.emit({ value, count: countSelections(value) });
    this.open.set(false);
  }

  protected clear() {
    this.draft.set({});
  }
}
