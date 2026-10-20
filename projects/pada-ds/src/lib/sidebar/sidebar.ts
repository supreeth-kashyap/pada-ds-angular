import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { uniqueId } from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

/** An icon: a built-in (or Material Symbols) icon name, or an image URL. */
export type SidebarIcon = string;

/** One clickable item in the data-driven sidebar. */
export interface SidebarMenuItemData {
  /** Stable identifier, also matched against the sidebar's `activeId`. */
  id: string;
  label: string;
  /** Leading icon: an icon name (`dashboard`) or an image URL. */
  icon?: SidebarIcon;
  /** Trailing text: a count or a short badge. */
  trailing?: string;
  /** Route or URL. With one, the item is a link. */
  href?: string;
  /** Marks the item as selected, overriding `activeId`. */
  selected?: boolean;
  disabled?: boolean;
}

/** A section of the data-driven sidebar. */
export interface SidebarSectionData {
  id?: string;
  /** Heading. Omit for an untitled group. */
  label?: string;
  /** Icon next to the heading. */
  icon?: SidebarIcon;
  items: SidebarMenuItemData[];
}

/** The logo of the data-driven sidebar, when it needs more than an image URL. */
export interface SidebarLogoData {
  /** Image shown as the logo mark. */
  src?: string;
  alt?: string;
  /** A built-in brand logo by name. */
  name?: string;
  /** Wordmark next to the mark. */
  title?: string;
  /** Makes the logo a link. */
  href?: string;
}

/** Everything the data-driven sidebar renders. */
export interface SidebarData {
  /**
   * The logo: omit for the default Pada logo, pass an image URL or `SidebarLogoData`, or `null`
   * to hide the logo header.
   */
  logo?: string | SidebarLogoData | null;
  /** Title (wordmark) next to the logo. */
  title?: string;
  /** Sections, top to bottom. */
  sections: SidebarSectionData[];
}

/** A click on an item of the data-driven sidebar. */
export interface SidebarItemClickEvent {
  item: SidebarMenuItemData;
  event: MouseEvent;
}

/** Image URLs contain a slash, a dot or a scheme; anything else is an icon name. */
const isImage = (icon: string) => /[/.:]/.test(icon);

/**
 * The logo header: an image (`src`), a built-in brand logo (`name`) or the default Pada logo,
 * with an optional title, as a link when given `href`.
 */
@Component({
  selector: 'ds-sidebar-logo',
  imports: [IconComponent, NgTemplateOutlet],
  template: `
    <ng-template #content>
      @if (src()) {
        <img class="sidebar-logo-mark" [src]="src()" [alt]="alt()" />
      } @else if (name()) {
        <!-- Stand-in for BrandLogo (built by another batch). -->
        <ds-icon class="sidebar-logo-mark" [name]="name()" [size]="32" />
      } @else if (title()) {
        <!-- Stand-in for <PadaLogo variant="mark" decorative>. -->
        <span class="sidebar-logo-mark sidebar-logo-default-mark" aria-hidden="true">P</span>
      } @else {
        <!-- Stand-in for <PadaLogo variant="lockup" title="Pada">. -->
        <span class="sidebar-logo-lockup" role="img" [attr.aria-label]="alt() || 'Pada'">
          <span class="sidebar-logo-default-mark" aria-hidden="true">P</span>
          <span aria-hidden="true">Pada</span>
        </span>
      }
      @if (title()) {
        <span class="sidebar-logo-title">{{ title() }}</span>
      }
    </ng-template>
    @if (href()) {
      <a
        class="sidebar-logo-link"
        [attr.href]="href()"
        [attr.aria-label]="title() || alt() || null"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else {
      <ng-container [ngTemplateOutlet]="content" />
    }
  `,
  styleUrl: './sidebar-logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-default]': 'src() || name() ? null : ""' },
})
export class SidebarLogoComponent {
  /** Image shown as the logo mark. Takes precedence over `name`. */
  readonly src = input<string>();
  /** Alt text for the image (and the name of the default logo). */
  readonly alt = input('');
  /** A built-in brand logo by name. */
  readonly name = input<string>();
  /** Wordmark next to the mark. */
  readonly title = input<string>();
  /** Makes the logo a link. */
  readonly href = input<string>();
}

/** The scrolling area under the logo, for composed sidebars. */
@Component({
  selector: 'ds-sidebar-body',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      box-sizing: border-box;
      width: 100%;
      min-height: 0;
      padding: var(--pada-space-1) var(--pada-space-4);
      overflow-y: auto;
    }
  `,
})
export class SidebarBodyComponent {}

/** A group of menu items with an optional heading. */
@Component({
  selector: 'ds-sidebar-section',
  imports: [IconComponent],
  template: `
    @if (label()) {
      <div class="sidebar-section-header" [id]="headingId">
        @if (icon(); as icon) {
          <span class="sidebar-section-icon" aria-hidden="true">
            @if (isImage(icon)) {
              <img [src]="icon" alt="" />
            } @else {
              <ds-icon [name]="icon" [size]="14" />
            }
          </span>
        }
        <span class="sidebar-section-label">{{ label() }}</span>
      </div>
    }
    <div class="sidebar-section-items"><ng-content /></div>
  `,
  styleUrl: './sidebar-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-labelledby]': 'label() ? headingId : null',
  },
})
export class SidebarSectionComponent {
  /** Heading. Omit for an untitled group. */
  readonly label = input<string>();
  /** Icon before the heading: an icon name or an image URL. */
  readonly icon = input<SidebarIcon>();
  protected readonly headingId = uniqueId('ds-sidebar-section-');
  protected readonly isImage = isImage;
}

/**
 * A menu item, on a native `<a>` (navigation) or `<button>` (action). The selected item gets
 * `aria-current="page"`.
 *
 * ```html
 * <a dsSidebarMenu href="/reports" icon="report" trailing="12">Reports</a>
 * ```
 */
@Component({
  selector: 'a[dsSidebarMenu], button[dsSidebarMenu]',
  imports: [IconComponent],
  template: `
    @if (icon(); as icon) {
      <span class="sidebar-menu-icon" aria-hidden="true">
        @if (isImage(icon)) {
          <img class="sidebar-menu-icon-img" [src]="icon" alt="" />
        } @else {
          <ds-icon [name]="icon" [size]="20" />
        }
      </span>
    }
    <span class="sidebar-menu-label"><ng-content /></span>
    @if (trailing()) {
      <span class="sidebar-menu-trailing">{{ trailing() }}</span>
    }
    <ng-content select="[dsSidebarMenuTrailing]" />
  `,
  styleUrl: './sidebar-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-current]': 'selected() ? "page" : null',
    '[attr.data-selected]': 'selected() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.disabled]': 'isButton && disabled() ? "" : null',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.tabindex]': '!isButton && disabled() ? -1 : null',
    '(click)': 'onClick($event)',
  },
})
export class SidebarMenuComponent {
  /** Leading icon: an icon name (`dashboard`) or an image URL. */
  readonly icon = input<SidebarIcon>();
  /** Trailing text, such as a count. For richer content, project `[dsSidebarMenuTrailing]`. */
  readonly trailing = input<string>();
  /** Marks the item as the current page. */
  readonly selected = input(false, { transform: booleanAttribute });
  /** Disables the item; a disabled link leaves the tab order and ignores clicks. */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly isButton = this.element.tagName === 'BUTTON';
  protected readonly isImage = isImage;

  constructor() {
    if (this.isButton && !this.element.hasAttribute('type'))
      this.element.setAttribute('type', 'button');
  }

  protected onClick(event: Event) {
    if (!this.disabled()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}

/** A search box for the sidebar. Named by its placeholder unless you give it a label. */
@Component({
  selector: 'ds-sidebar-search',
  template: `
    <input
      class="sidebar-search-input"
      type="search"
      [attr.aria-label]="label() || placeholder()"
      [placeholder]="placeholder()"
      [value]="value()"
      (input)="value.set($any($event.target).value)"
    />
  `,
  styleUrl: './sidebar-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarSearchComponent {
  /** Placeholder text. @default 'Search...' */
  readonly placeholder = input('Search...');
  /** Accessible name. @default the placeholder */
  readonly label = input<string>();
  /** The query. Two-way bindable: `[(value)]`. */
  readonly value = model('');
}

/** A collapsible group: a button that shows and hides its content. */
@Component({
  selector: 'ds-sidebar-collapse',
  imports: [IconComponent],
  template: `
    @if (label()) {
      <button
        type="button"
        class="sidebar-collapse-trigger"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="contentId"
        [attr.data-state]="open() ? 'open' : 'closed'"
        (click)="open.set(!open())"
      >
        <span class="sidebar-collapse-label">{{ label() }}</span>
        <ds-icon class="sidebar-collapse-icon" name="chevron_down" [size]="16" />
      </button>
    }
    <div
      class="sidebar-collapse-content"
      [id]="contentId"
      [attr.data-state]="open() ? 'open' : 'closed'"
      [hidden]="!!label() && !open()"
    >
      <ng-content />
    </div>
  `,
  styleUrl: './sidebar-collapse.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarCollapseComponent {
  /** The trigger's label. Without one the content is always shown. */
  readonly label = input<string>();
  /** Whether the content is shown. Two-way bindable: `[(open)]`. @default false */
  readonly open = model(false);
  protected readonly contentId = uniqueId('ds-sidebar-collapse-');
}

/** A plain list of items inside a section. */
@Component({
  selector: 'ul[dsSidebarSectionMenu]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
  `,
})
export class SidebarSectionMenuComponent {}

/**
 * The application sidebar: a logo header and scrolling sections of menu items. Give it `data`
 * to render everything from one object, or compose the parts yourself.
 *
 * ```html
 * <ds-sidebar [data]="nav" [activeId]="route" (itemClick)="go($event.item)" />
 *
 * <ds-sidebar>
 *   <ds-sidebar-logo title="Acme" href="/" />
 *   <ds-sidebar-body>
 *     <ds-sidebar-section label="Workspace">
 *       <a dsSidebarMenu href="/" icon="dashboard" selected>Dashboard</a>
 *       <button dsSidebarMenu icon="team" trailing="3">Team</button>
 *     </ds-sidebar-section>
 *   </ds-sidebar-body>
 * </ds-sidebar>
 * ```
 *
 * It fills its parent's height (give the shell a height) and scrolls the body, so the logo
 * stays pinned. Differences from React: item labels and icons are strings (icon names or
 * image URLs), item `onClick` is the `itemClick` output, `ds-sidebar-body` wraps composed
 * sections, selection is `aria-current="page"` plus `data-selected` (no state classes), and
 * the default Pada logo is a stand-in until the PadaLogo component lands.
 */
@Component({
  selector: 'ds-sidebar',
  imports: [
    SidebarLogoComponent,
    SidebarBodyComponent,
    SidebarSectionComponent,
    SidebarMenuComponent,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  /** Data-driven content. Without it, the sidebar renders its projected parts. */
  readonly data = input<SidebarData>();
  /** Id of the active item, for items that do not set `selected`. */
  readonly activeId = input<string>();
  /** Accessible name of the sidebar landmark. @default 'Sidebar' */
  readonly label = input('Sidebar');
  /** An item of the data-driven sidebar was clicked. */
  readonly itemClick = output<SidebarItemClickEvent>();

  protected readonly logo = computed<SidebarLogoData | null>(() => {
    const data = this.data();
    if (!data) return null;
    const { logo, title } = data;
    if (logo === null) return null;
    if (typeof logo === 'string') return { src: logo, title };
    return { ...logo, title: logo?.title ?? title };
  });

  /** The sections, with each item's selection resolved against `activeId`. */
  protected readonly sections = computed(() => {
    const activeId = this.activeId();
    return (this.data()?.sections ?? []).map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        item,
        selected: item.selected ?? (activeId !== undefined && item.id === activeId),
      })),
    }));
  });
}

/** Every Sidebar part, for `imports`. */
export const SidebarParts = [
  SidebarComponent,
  SidebarLogoComponent,
  SidebarBodyComponent,
  SidebarSectionComponent,
  SidebarMenuComponent,
  SidebarSearchComponent,
  SidebarCollapseComponent,
  SidebarSectionMenuComponent,
] as const;
