import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsContextMenu, DsContextMenuTrigger } from 'pada-ds-angular/headless';
import { MenuItemParts } from '../dropdown-menu/dropdown-menu';

/**
 * A menu opened by right-clicking (or Shift+F10, or a long press on) an area, at the pointer.
 * Everything inside is a dropdown menu part: items with icons and shortcuts, checkbox and radio
 * items, labels, separators and submenus. Name the content with `ariaLabel`.
 *
 * ```html
 * <ds-context-menu>
 *   <ds-context-menu-trigger tabindex="0">Report.pdf</ds-context-menu-trigger>
 *   <ds-context-menu-content ariaLabel="File actions">
 *     <ds-dropdown-menu-item icon="edit_1" shortcut="F2" (select)="rename()">Rename</ds-dropdown-menu-item>
 *     <ds-dropdown-menu-separator />
 *     <ds-dropdown-menu-item tone="danger" (select)="remove()">Delete</ds-dropdown-menu-item>
 *   </ds-context-menu-content>
 * </ds-context-menu>
 * ```
 *
 * Differences from React: `ds-context-menu-content` is the dropdown menu content (it stays in
 * place in the DOM, in the top layer), and `onOpenChange` is `(openChange)` / `[(open)]`.
 */
@Component({
  selector: 'ds-context-menu',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsContextMenu, inputs: ['open', 'dir'], outputs: ['openChange'] }],
  styles: ':host { display: contents; }',
})
export class ContextMenuComponent {}

/** The area that opens the menu. Shows a soft ring while its menu is open. */
@Component({
  selector: 'ds-context-menu-trigger',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsContextMenuTrigger, inputs: ['disabled'] }],
  styles: `
    :host {
      display: block;
      border-radius: var(--pada-radius-lg);
      transition: box-shadow var(--pada-duration-fast) var(--pada-ease-standard);
      -webkit-touch-callout: none;
    }

    :host([data-state='open']) {
      box-shadow: 0 0 0 2px var(--pada-color-accent-subtle);
    }

    :host(:focus-visible) {
      outline: none;
      box-shadow: var(--pada-shadow-focus);
    }
  `,
})
export class ContextMenuTriggerComponent {}

/** The context menu root and trigger, plus every dropdown menu item part. */
export const ContextMenuParts = [
  ContextMenuComponent,
  ContextMenuTriggerComponent,
  ...MenuItemParts,
] as const;
