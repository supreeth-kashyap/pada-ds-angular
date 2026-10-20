import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { findNextIndex, focusElement, keyToNavigation, uniqueId } from 'pada-ds-angular/headless';
import { ComboBoxMenuItemComponent } from './combo-box-menu-item';

/** One option of a `ds-combo-box`. */
export interface ComboBoxItem {
  /** Stable identifier; also what `itemClick` reports. */
  id: string;
  label: string;
  /** Built-in icon name shown before the label. */
  iconName?: string;
  selected?: boolean;
  disabled?: boolean;
  /** The option an owning combobox currently points at with `aria-activedescendant`. */
  active?: boolean;
  /** Heading of the group the option belongs to. Consecutive options with the same group are grouped. */
  group?: string;
}

/** Payload of `itemClick`. */
export interface ComboBoxItemClick {
  item: ComboBoxItem;
  index: number;
}

interface ComboBoxEntry {
  item: ComboBoxItem;
  index: number;
  optionId: string | null;
}

interface ComboBoxSection {
  label: string | null;
  labelId: string | null;
  entries: ComboBoxEntry[];
}

/**
 * A list of selectable options (`role="listbox"`), rendered from data.
 *
 * Without an `id` the listbox manages focus itself: it is one tab stop (the option focused
 * last, else the first selected, else the first enabled one), and ArrowUp/ArrowDown, Home and
 * End move between options, skipping disabled ones. With an `id`, an owning combobox (such as
 * `ds-select`) keeps focus and points at options through `aria-activedescendant`; options are
 * `${id}-option-${index}` and the `active` one is highlighted.
 *
 * ```html
 * <ds-combo-box aria-label="Owners" [items]="owners" multiSelect (itemClick)="toggle($event.item)" />
 * ```
 *
 * Give it an accessible name (`aria-label` or `aria-labelledby`). Differences from React:
 * options can be grouped under headings through `group` (each group is `role="group"`), and
 * labels are plain strings.
 */
@Component({
  selector: 'ds-combo-box',
  imports: [ComboBoxMenuItemComponent, NgTemplateOutlet],
  templateUrl: './combo-box.html',
  styleUrl: './combo-box.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listbox',
    '[attr.id]': 'id() ?? null',
    '[attr.aria-multiselectable]': 'multiSelect() || null',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class ComboBoxComponent {
  /** The options, in order. */
  readonly items = input.required<readonly ComboBoxItem[]>();
  /** Several options can be selected: sets `aria-multiselectable` and shows ticks. */
  readonly multiSelect = input(false, { transform: booleanAttribute });
  /** Hands focus management to an owning combobox (see above). */
  readonly id = input<string>();
  /** An option was clicked (or activated with Enter or Space). */
  readonly itemClick = output<ComboBoxItemClick>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly fallbackId = uniqueId('ds-combo-box-');
  private readonly focusedIndex = signal<number | null>(null);
  protected readonly managesFocus = computed(() => !this.id());

  /** The roving tab stop. */
  protected readonly tabStop = computed(() => {
    const items = this.items();
    const focused = this.focusedIndex();
    const enabled = (index: number) => index >= 0 && index < items.length && !items[index].disabled;
    if (focused !== null && enabled(focused)) return focused;
    const firstSelected = items.findIndex((item) => item.selected && !item.disabled);
    return firstSelected !== -1 ? firstSelected : items.findIndex((item) => !item.disabled);
  });

  protected readonly sections = computed(() => {
    const id = this.id();
    const sections: ComboBoxSection[] = [];
    this.items().forEach((item, index) => {
      const label = item.group ?? null;
      let section = sections[sections.length - 1];
      if (!section || section.label !== label) {
        const labelId = label === null ? null : `${id ?? this.fallbackId}-group-${sections.length}`;
        section = { label, labelId, entries: [] };
        sections.push(section);
      }
      section.entries.push({ item, index, optionId: id ? `${id}-option-${index}` : null });
    });
    return sections;
  });

  protected onFocus(index: number) {
    if (this.managesFocus()) this.focusedIndex.set(index);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || !this.managesFocus()) return;
    const step = keyToNavigation(event.key, 'vertical', 'ltr');
    if (!step) return;
    const options = Array.from(this.element.querySelectorAll<HTMLElement>('[role="option"]'));
    const items = this.items();
    const next = findNextIndex(
      items.map((item) => ({ label: item.label, disabled: item.disabled })),
      options.indexOf(event.target as HTMLElement),
      step,
    );
    if (next === -1) return;
    event.preventDefault();
    focusElement(options[next]);
  }
}
