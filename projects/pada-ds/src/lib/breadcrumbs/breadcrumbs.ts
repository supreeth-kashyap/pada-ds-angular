import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { IconComponent } from '../icon/icon';

/** One step of the trail. */
export interface BreadcrumbItem {
  label: string;
  /** Link target. Omit for the current page (the last item) or for plain text. */
  href?: string;
}

/** Context of a custom link template (`linkTemplate`), e.g. for router links. */
export interface BreadcrumbLinkContext {
  /** The item to link to. */
  $implicit: BreadcrumbItem;
  /** The class that styles a breadcrumb link. */
  className: string;
}

/** A click on a breadcrumb link. Call `event.preventDefault()` to route on the client. */
export interface BreadcrumbNavigateEvent {
  item: BreadcrumbItem;
  event: MouseEvent;
}

type Entry = BreadcrumbItem | 'ellipsis';

/**
 * Where the current page sits in the hierarchy (WAI-ARIA APG Breadcrumb): a labelled navigation
 * landmark with an ordered list ending in the current page (`aria-current="page"`).
 *
 * ```html
 * <ds-breadcrumbs [items]="trail" [maxItems]="4" (navigate)="go($event)" />
 *
 * <!-- Router links -->
 * <ds-breadcrumbs [items]="trail" [linkTemplate]="routerLink" />
 * <ng-template #routerLink let-item let-className="className">
 *   <a [class]="className" [routerLink]="item.href">{{ item.label }}</a>
 * </ng-template>
 * ```
 *
 * Long trails collapse to the first item, an expand button and the last `maxItems - 1` items.
 * Expanding moves focus to the first revealed link. Differences from React: items have no
 * `onClick` (listen to `navigate`), and `renderLink` is a `linkTemplate`.
 */
@Component({
  selector: 'ds-breadcrumbs',
  imports: [IconComponent, NgTemplateOutlet],
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent {
  /** Trail from the root to the current page. The last item is the current page. */
  readonly items = input.required<BreadcrumbItem[]>();
  /**
   * Collapse the middle of long trails: show the first item, an expand button, and the last
   * `maxItems - 1` items. At least 2.
   */
  readonly maxItems = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null || value === '' ? undefined : numberAttribute(value),
  });
  /** Accessible name of the navigation landmark. @default 'Breadcrumb' */
  readonly label = input('Breadcrumb');
  /** Renders each link yourself (router links). Context: the item and `className`. */
  readonly linkTemplate = input<TemplateRef<BreadcrumbLinkContext>>();
  /** A breadcrumb link was clicked. */
  readonly navigate = output<BreadcrumbNavigateEvent>();

  private readonly expanded = signal(false);
  private readonly list = viewChild.required<ElementRef<HTMLOListElement>>('list');
  private readonly injector = inject(Injector);

  protected readonly visible = computed<Entry[]>(() => {
    const items = this.items();
    const max = this.maxItems();
    const collapse = !this.expanded() && max !== undefined && max >= 2 && items.length > max;
    return collapse ? [items[0], 'ellipsis', ...items.slice(items.length - (max - 1))] : items;
  });

  protected expand() {
    this.expanded.set(true);
    // The expand button disappears when pressed; move focus to the first item it revealed so
    // keyboard users don't lose their place.
    afterNextRender(
      () =>
        this.list()
          .nativeElement.querySelector<HTMLElement>(
            ':scope > li:nth-child(n + 2) :is(a, button, [tabindex])',
          )
          ?.focus(),
      { injector: this.injector },
    );
  }
}
