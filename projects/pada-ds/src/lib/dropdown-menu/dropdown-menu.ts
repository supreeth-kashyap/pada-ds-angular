import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import {
  Align,
  AutoFocusEvent,
  DismissEvent,
  DsDropdownMenu,
  DsDropdownMenuCheckboxItem,
  DsDropdownMenuContent,
  DsDropdownMenuGroup,
  DsDropdownMenuItem,
  DsDropdownMenuItemIndicator,
  DsDropdownMenuLabel,
  DsDropdownMenuRadioGroup,
  DsDropdownMenuRadioItem,
  DsDropdownMenuSeparator,
  DsDropdownMenuSub,
  DsDropdownMenuSubTrigger,
  DsDropdownMenuTrigger,
  DsMenuContext,
  DsPresence,
  Side,
} from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

export type DropdownMenuItemTone = 'default' | 'danger';

const optionalNumber = (value: unknown): number | undefined =>
  value == null || value === '' ? undefined : numberAttribute(value);

/**
 * A menu of actions opened from a button (WAI-ARIA APG Menu Button): arrow keys, Home/End,
 * type-ahead, checkbox and radio items, and submenus. Holds the open state.
 *
 * ```html
 * <ds-dropdown-menu>
 *   <button dsButton variant="secondary" rightIcon="chevron_down" dsDropdownMenuTrigger>
 *     Actions
 *   </button>
 *   <ds-dropdown-menu-content>
 *     <ds-dropdown-menu-label>Item</ds-dropdown-menu-label>
 *     <ds-dropdown-menu-item icon="edit_1" shortcut="⌘E" (select)="rename()">Rename</ds-dropdown-menu-item>
 *     <ds-dropdown-menu-checkbox-item [(checked)]="pinned">Pinned</ds-dropdown-menu-checkbox-item>
 *     <ds-dropdown-menu-sub>
 *       <ds-dropdown-menu-sub-trigger>Move to</ds-dropdown-menu-sub-trigger>
 *       <ds-dropdown-menu-sub-content>
 *         <ds-dropdown-menu-item (select)="archive()">Archive</ds-dropdown-menu-item>
 *       </ds-dropdown-menu-sub-content>
 *     </ds-dropdown-menu-sub>
 *     <ds-dropdown-menu-separator />
 *     <ds-dropdown-menu-item tone="danger" (select)="remove()">Delete</ds-dropdown-menu-item>
 *   </ds-dropdown-menu-content>
 * </ds-dropdown-menu>
 * ```
 *
 * Differences from React: the content stays in place in the DOM and joins the top layer, so
 * there is no `container` input; the trigger is the `dsDropdownMenuTrigger` directive on your
 * own button instead of `asChild`; `onSelect` is the `(select)` output (prevent its event to keep
 * the menu open) and `onCheckedChange` / `onValueChange` are `[(checked)]` / `[(value)]`.
 */
@Component({
  selector: 'ds-dropdown-menu',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsDropdownMenu, inputs: ['open', 'dir'], outputs: ['openChange'] }],
  styles: ':host { display: contents; }',
})
export class DropdownMenuComponent {}

/**
 * The menu panel, in the top layer, animated from its trigger. Also used as
 * `ds-dropdown-menu-sub-content` (a submenu, opening to the side), `ds-context-menu-content`
 * (at the pointer) and `ds-menubar-content`. Restyle it through `--pada-menu-*` tokens.
 */
@Component({
  selector:
    'ds-dropdown-menu-content, ds-dropdown-menu-sub-content, ds-context-menu-content, ds-menubar-content',
  imports: [DsPresence, DsDropdownMenuContent],
  template: `
    <div
      *dsPresence="menu.open()"
      dsDropdownMenuContent
      class="menu"
      [attr.aria-label]="ariaLabel() || null"
      [side]="side()"
      [align]="align()"
      [sideOffset]="sideOffset()"
      [alignOffset]="alignOffset()"
      [avoidCollisions]="avoidCollisions()"
      [collisionPadding]="collisionPadding()"
      [hideWhenDetached]="hideWhenDetached()"
      [loop]="loop()"
      (closeAutoFocus)="closeAutoFocus.emit($event)"
      (escapeKeyDown)="escapeKeyDown.emit($event)"
      (pointerDownOutside)="pointerDownOutside.emit($event)"
      (focusOutside)="focusOutside.emit($event)"
      (interactOutside)="interactOutside.emit($event)"
    >
      <ng-content />
    </div>
  `,
  styleUrl: './dropdown-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'none' },
})
export class DropdownMenuContentComponent {
  protected readonly menu = inject(DsMenuContext);
  /** Accessible name. Required for context menus, which have no trigger button to name them. */
  readonly ariaLabel = input<string>();
  /** Preferred side. @default 'bottom'; submenus 'right' ('left' in RTL) */
  readonly side = input<Side>();
  /** Alignment along the side. @default 'start' */
  readonly align = input<Align>('start');
  /** Gap from the trigger, in px. @default 4; submenus 0; context menus 2 */
  readonly sideOffset = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /** Shift along the alignment axis, in px. @default 0; submenus -4 */
  readonly alignOffset = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /** Flip and shift to stay in the viewport. @default true */
  readonly avoidCollisions = input(true, { transform: booleanAttribute });
  /** Distance to keep from the viewport edges, in px. @default 8 */
  readonly collisionPadding = input(8, { transform: numberAttribute });
  /** Hide the menu when its trigger scrolls out of view. */
  readonly hideWhenDetached = input(false, { transform: booleanAttribute });
  /** Wrap focus from the last item to the first and back. @default true */
  readonly loop = input(true, { transform: booleanAttribute });
  /** Focus is about to return to the trigger. Prevent it to focus something else yourself. */
  readonly closeAutoFocus = output<AutoFocusEvent>();
  /** Escape was pressed. Prevent it to keep the menu open. */
  readonly escapeKeyDown = output<DismissEvent<KeyboardEvent>>();
  /** A pointer went down outside. Prevent it to keep the menu open. */
  readonly pointerDownOutside = output<DismissEvent<PointerEvent>>();
  /** Focus moved outside. Prevent it to keep the menu open. */
  readonly focusOutside = output<DismissEvent<FocusEvent>>();
  /** Any interaction outside. Prevent it to keep the menu open. */
  readonly interactOutside = output<DismissEvent<PointerEvent | FocusEvent>>();
}

/** An action, with an optional icon and shortcut hint. Closes the menu unless `select` is prevented. */
@Component({
  selector: 'ds-dropdown-menu-item',
  imports: [IconComponent],
  template: `
    @if (icon(); as name) {
      <ds-icon class="menu-item-icon" [name]="name" [size]="16" />
    }
    <span class="menu-item-label"><ng-content /></span>
    @if (shortcut(); as keys) {
      <kbd class="menu-shortcut">{{ keys }}</kbd>
    }
  `,
  styleUrl: './menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    // `select` mirrors React's onSelect (see DsMenuItemBase).
    // eslint-disable-next-line @angular-eslint/no-output-native
    { directive: DsDropdownMenuItem, inputs: ['disabled', 'textValue'], outputs: ['select'] },
  ],
  host: { '[attr.data-tone]': 'tone()' },
})
export class DropdownMenuItemComponent {
  /** Built-in icon name shown before the label. */
  readonly icon = input<string>();
  /** Keyboard shortcut hint shown after the label, e.g. "⌘D". Display only. */
  readonly shortcut = input<string>();
  /** Destructive actions use the danger colours. @default 'default' */
  readonly tone = input<DropdownMenuItemTone>('default');
}

/** A toggle with a check mark. Two-way bind `[(checked)]`. */
@Component({
  selector: 'ds-dropdown-menu-checkbox-item',
  imports: [IconComponent, DsDropdownMenuItemIndicator],
  template: `
    <span class="menu-item-indicator">
      <span class="menu-check" dsDropdownMenuItemIndicator>
        <ds-icon name="tick_1" [size]="14" />
      </span>
    </span>
    <span class="menu-item-label"><ng-content /></span>
    @if (shortcut(); as keys) {
      <kbd class="menu-shortcut">{{ keys }}</kbd>
    }
  `,
  styleUrl: './menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: DsDropdownMenuCheckboxItem,
      inputs: ['checked', 'disabled', 'textValue'],
      // `select` mirrors React's onSelect (see DsMenuItemBase).
      // eslint-disable-next-line @angular-eslint/no-output-native
      outputs: ['checkedChange', 'select'],
    },
  ],
})
export class DropdownMenuCheckboxItemComponent {
  /** Keyboard shortcut hint shown after the label. Display only. */
  readonly shortcut = input<string>();
}

/** Groups radio items; exactly one is checked. Two-way bind `[(value)]`; name it with `aria-label`. */
@Component({
  selector: 'ds-dropdown-menu-radio-group',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: DsDropdownMenuRadioGroup, inputs: ['value'], outputs: ['valueChange'] },
  ],
  styles: ':host { display: block; }',
})
export class DropdownMenuRadioGroupComponent {}

/** One option in a radio group, with a dot when checked. */
@Component({
  selector: 'ds-dropdown-menu-radio-item',
  imports: [DsDropdownMenuItemIndicator],
  template: `
    <span class="menu-item-indicator">
      <span class="menu-radio-dot" dsDropdownMenuItemIndicator></span>
    </span>
    <span class="menu-item-label"><ng-content /></span>
    @if (shortcut(); as keys) {
      <kbd class="menu-shortcut">{{ keys }}</kbd>
    }
  `,
  styleUrl: './menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: DsDropdownMenuRadioItem,
      inputs: ['value', 'disabled', 'textValue'],
      // `select` mirrors React's onSelect (see DsMenuItemBase).
      // eslint-disable-next-line @angular-eslint/no-output-native
      outputs: ['select'],
    },
  ],
})
export class DropdownMenuRadioItemComponent {
  /** Keyboard shortcut hint shown after the label. Display only. */
  readonly shortcut = input<string>();
}

/** A non-focusable heading for a group of items. */
@Component({
  selector: 'ds-dropdown-menu-label',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DsDropdownMenuLabel],
  styles: `
    :host {
      display: block;
      padding: var(--pada-space-1-5) var(--pada-space-2) var(--pada-space-1);
      font-size: var(--pada-font-size-sm);
      font-weight: var(--pada-font-weight-semibold);
      color: var(--pada-color-fg-muted);
    }
  `,
})
export class DropdownMenuLabelComponent {}

/** Groups related items. Label it with `aria-label` or `aria-labelledby`. */
@Component({
  selector: 'ds-dropdown-menu-group',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DsDropdownMenuGroup],
  styles: ':host { display: block; }',
})
export class DropdownMenuGroupComponent {}

/** A divider between groups of items. */
@Component({
  selector: 'ds-dropdown-menu-separator',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DsDropdownMenuSeparator],
  styles: `
    :host {
      display: block;
      height: var(--pada-border-width-thin);
      margin: var(--pada-space-1) calc(-1 * var(--pada-menu-pad));
      background-color: var(--pada-color-border-subtle);
    }
  `,
})
export class DropdownMenuSeparatorComponent {}

/** A nested menu: a `ds-dropdown-menu-sub-trigger` and its `ds-dropdown-menu-sub-content`. */
@Component({
  selector: 'ds-dropdown-menu-sub',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsDropdownMenuSub, inputs: ['open'], outputs: ['openChange'] }],
  host: { role: 'none' },
  styles: ':host { display: contents; }',
})
export class DropdownMenuSubComponent {}

/** The item that opens a submenu, with a chevron. */
@Component({
  selector: 'ds-dropdown-menu-sub-trigger',
  imports: [IconComponent],
  template: `
    @if (icon(); as name) {
      <ds-icon class="menu-item-icon" [name]="name" [size]="16" />
    }
    <span class="menu-item-label"><ng-content /></span>
    <ds-icon class="menu-item-chevron" name="chevron_right" [size]="14" />
  `,
  styleUrl: './menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsDropdownMenuSubTrigger, inputs: ['disabled', 'textValue'] }],
})
export class DropdownMenuSubTriggerComponent {
  /** Built-in icon name shown before the label. */
  readonly icon = input<string>();
}

/** Every dropdown menu part, including the headless trigger directive. */
export const DropdownMenuParts = [
  DropdownMenuComponent,
  DropdownMenuContentComponent,
  DropdownMenuItemComponent,
  DropdownMenuCheckboxItemComponent,
  DropdownMenuRadioGroupComponent,
  DropdownMenuRadioItemComponent,
  DropdownMenuLabelComponent,
  DropdownMenuGroupComponent,
  DropdownMenuSeparatorComponent,
  DropdownMenuSubComponent,
  DropdownMenuSubTriggerComponent,
  DsDropdownMenuTrigger,
] as const;

/** The item parts shared by the dropdown menu, context menu and menubar. */
export const MenuItemParts = [
  DropdownMenuContentComponent,
  DropdownMenuItemComponent,
  DropdownMenuCheckboxItemComponent,
  DropdownMenuRadioGroupComponent,
  DropdownMenuRadioItemComponent,
  DropdownMenuLabelComponent,
  DropdownMenuGroupComponent,
  DropdownMenuSeparatorComponent,
  DropdownMenuSubComponent,
  DropdownMenuSubTriggerComponent,
] as const;

export { DsDropdownMenuTrigger };
