import { ChangeDetectionStrategy, Component, input, booleanAttribute } from '@angular/core';
import { DsMenubar, DsMenubarMenu, DsMenubarTrigger } from 'pada-ds-angular/headless';
import { MenuItemParts } from '../dropdown-menu/dropdown-menu';

/**
 * A row of menus, as in a desktop application (WAI-ARIA APG Menubar). One Tab stop; arrow keys
 * move along the bar and between open menus, and hovering switches menus while one is open.
 * Name it with `aria-label`. Items are the dropdown menu items. Restyle it through
 * `--pada-menubar-*` tokens.
 *
 * ```html
 * <ds-menubar aria-label="Editor">
 *   <ds-menubar-menu value="file">
 *     <ds-menubar-trigger>File</ds-menubar-trigger>
 *     <ds-menubar-content>
 *       <ds-dropdown-menu-item shortcut="⌘N" (select)="newFile()">New file</ds-dropdown-menu-item>
 *       <ds-dropdown-menu-separator />
 *       <ds-dropdown-menu-item (select)="close()">Close</ds-dropdown-menu-item>
 *     </ds-menubar-content>
 *   </ds-menubar-menu>
 * </ds-menubar>
 * ```
 *
 * Differences from React: the open menu is `[(value)]`; `ds-menubar-content` is the dropdown
 * menu content (in place in the DOM, in the top layer); `ds-menubar-trigger` renders its own
 * `<button>`.
 */
@Component({
  selector: 'ds-menubar',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: DsMenubar, inputs: ['value', 'loop', 'dir'], outputs: ['valueChange'] },
  ],
  styles: `
    :host {
      /* Component tokens */
      --pada-menubar-bg: var(--pada-color-surface);
      --pada-menubar-border: var(--pada-color-border);
      --pada-menubar-radius: var(--pada-radius-md);
      --pada-menubar-pad: var(--pada-space-1);
      --pada-menubar-gap: var(--pada-space-1);

      display: inline-flex;
      align-items: center;
      gap: var(--pada-menubar-gap);
      padding: var(--pada-menubar-pad);
      border: var(--pada-border-width-thin) solid var(--pada-menubar-border);
      border-radius: var(--pada-menubar-radius);
      background: var(--pada-menubar-bg);
      font-family: var(--pada-font-sans);
    }
  `,
})
export class MenubarComponent {}

/** One menu in the bar: a `ds-menubar-trigger` and its `ds-menubar-content`. */
@Component({
  selector: 'ds-menubar-menu',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsMenubarMenu, inputs: ['value'] }],
  host: { role: 'none' },
  styles: ':host { display: contents; }',
})
export class MenubarMenuComponent {}

/** A menu's name in the bar. */
@Component({
  selector: 'ds-menubar-trigger',
  imports: [DsMenubarTrigger],
  template: `<button dsMenubarTrigger class="menubar-trigger" [disabled]="disabled()">
    <ng-content />
  </button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'none' },
  styles: `
    :host {
      display: contents;
    }

    .menubar-trigger {
      --pada-menubar-trigger-bg: transparent;
      --pada-menubar-trigger-fg: var(--pada-color-fg);

      display: inline-flex;
      align-items: center;
      height: var(--pada-control-height-sm);
      padding-inline: var(--pada-space-3);
      border: none;
      border-radius: calc(var(--pada-menubar-radius) - var(--pada-menubar-pad));
      background: var(--pada-menubar-trigger-bg);
      color: var(--pada-menubar-trigger-fg);
      font: inherit;
      font-size: var(--pada-font-size-sm);
      font-weight: var(--pada-font-weight-medium);
      cursor: default;
      outline: none;
      transition: background-color var(--pada-duration-fast) var(--pada-ease-standard);
    }

    /* States via attributes */
    .menubar-trigger:hover {
      --pada-menubar-trigger-bg: var(--pada-color-neutral-subtle);
    }

    .menubar-trigger[data-state='open'] {
      --pada-menubar-trigger-bg: var(--pada-color-neutral-subtle-hover);
    }

    .menubar-trigger:focus-visible {
      box-shadow: var(--pada-shadow-focus);
    }

    .menubar-trigger[data-disabled] {
      --pada-menubar-trigger-bg: transparent;
      --pada-menubar-trigger-fg: var(--pada-color-fg-disabled);
    }
  `,
})
export class MenubarTriggerComponent {
  /** Skipped by the arrow keys and cannot open. */
  readonly disabled = input(false, { transform: booleanAttribute });
}

/** Every menubar part, plus every dropdown menu item part (`ds-menubar-content` among them). */
export const MenubarParts = [
  MenubarComponent,
  MenubarMenuComponent,
  MenubarTriggerComponent,
  ...MenuItemParts,
] as const;
