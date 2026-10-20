import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  input,
  output,
} from '@angular/core';
import type { BreadcrumbItem, BreadcrumbNavigateEvent } from '../breadcrumbs/breadcrumbs';
import { IconComponent } from '../icon/icon';
import { PopoverParts } from '../popover/popover';

/** Marks custom content for the profile button (an avatar), in place of the default icon. */
@Directive({ selector: '[dsPageHeaderProfileTrigger]' })
export class DsPageHeaderProfileTrigger {}

/** Marks the profile menu content, shown in a popover from the profile button. */
@Directive({ selector: '[dsPageHeaderProfileMenu]' })
export class DsPageHeaderProfileMenu {}

/**
 * The bar at the top of a page: a breadcrumb trail on the left; a command (search) button, an
 * AI button and a profile button on the right.
 *
 * ```html
 * <ds-page-header [breadcrumbs]="trail" (commandClick)="palette.open()" (aiClick)="assistant.open()">
 *   <img dsPageHeaderProfileTrigger src="/me.png" alt="" />
 *   <div dsPageHeaderProfileMenu>…</div>
 * </ds-page-header>
 * ```
 *
 * Trails longer than three collapse to the first and last crumbs with a "…" button that lists
 * the rest. Differences from React: the trail is a labelled `nav` list with
 * `aria-current="page"`; crumb clicks are the `navigate` output; the profile button is named
 * by `profileLabel`; the hidden crumbs and the profile menu open in a Popover (stand-in for
 * DropdownMenu, built by another batch), so they get Escape, outside-click and focus handling;
 * the shortcut is a plain `<kbd>` (stand-in for Kbd).
 */
@Component({
  selector: 'ds-page-header',
  imports: [IconComponent, NgTemplateOutlet, ...PopoverParts],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  /** Trail from the root to the current page; the last item is the current page. */
  readonly breadcrumbs = input.required<BreadcrumbItem[]>();
  /** Text of the command button. @default 'Search' */
  readonly commandLabel = input('Search');
  /** Shortcut shown on the command button. @default '⌘+K' */
  readonly commandShortcut = input('⌘+K');
  /** Text of the AI button. @default 'AI' */
  readonly aiLabel = input('AI');
  /** Accessible name of the profile button. @default 'Account' */
  readonly profileLabel = input('Account');
  /** The command (search) button was clicked. */
  readonly commandClick = output<void>();
  /** The AI button was clicked. */
  readonly aiClick = output<void>();
  /** A breadcrumb link was clicked. Call `event.preventDefault()` to route on the client. */
  readonly navigate = output<BreadcrumbNavigateEvent>();

  protected readonly profileTrigger = contentChild(DsPageHeaderProfileTrigger);
  protected readonly profileMenu = contentChild(DsPageHeaderProfileMenu);

  protected readonly crumbs = computed(() => {
    const items = this.breadcrumbs();
    if (items.length <= 3) return { first: null, hidden: [], visible: items };
    return { first: items[0], hidden: items.slice(1, -1), visible: [items[items.length - 1]] };
  });
}

/** The page header and its content markers, for `imports`. */
export const PageHeaderParts = [
  PageHeaderComponent,
  DsPageHeaderProfileTrigger,
  DsPageHeaderProfileMenu,
] as const;
