import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  DsTabs,
  DsTabsContent,
  DsTabsIndicator,
  DsTabsList,
  DsTabsTrigger,
  DsVisuallyHidden,
} from 'pada-ds-angular/headless';

export type TabsVariant = 'underline' | 'pills';

/**
 * Tabbed sections (WAI-ARIA APG Tabs): arrow keys move between tabs (skipping disabled ones),
 * Home/End jump to the ends, and an underline or pill slides to the selected tab.
 *
 * ```html
 * <ds-tabs [(value)]="tab" variant="pills">
 *   <ds-tabs-list aria-label="Project">
 *     <ds-tabs-trigger value="overview">Overview</ds-tabs-trigger>
 *     <ds-tabs-trigger value="activity" notification>Activity</ds-tabs-trigger>
 *   </ds-tabs-list>
 *   <ds-tabs-content value="overview">…</ds-tabs-content>
 *   <ds-tabs-content value="activity">…</ds-tabs-content>
 * </ds-tabs>
 * ```
 *
 * Differences from React: the selected tab is `[(value)]` (no `defaultValue`), and the 1.x
 * `<Tabs label><TabPanel label>` children API is not ported; compose the parts instead.
 */
@Component({
  selector: 'ds-tabs',
  template: '<ng-content />',
  styleUrl: './tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: DsTabs,
      inputs: ['value', 'orientation', 'activationMode', 'dir'],
      outputs: ['valueChange'],
    },
  ],
  host: { '[attr.data-variant]': 'variant()' },
})
export class TabsComponent {
  /** `underline` (a sliding bar under the selected tab) or `pills` (a sliding filled pill). */
  readonly variant = input<TabsVariant>('underline');
}

/** The tab list, with the sliding indicator. Name it with `aria-label`. */
@Component({
  selector: 'ds-tabs-list',
  imports: [DsTabsIndicator],
  template: '<ng-content /><span dsTabsIndicator class="tabs-indicator"></span>',
  styleUrl: './tabs-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsTabsList, inputs: ['loop'] }],
})
export class TabsListComponent {}

/** One tab, rendered as a `<button>`. */
@Component({
  selector: 'ds-tabs-trigger',
  imports: [DsTabsTrigger, DsVisuallyHidden],
  template: `
    <button dsTabsTrigger class="tabs-trigger" [value]="value()" [disabled]="disabled()">
      <ng-content />
      @if (notification()) {
        <span class="tabs-notification" aria-hidden="true"></span>
        <span dsVisuallyHidden>, unread updates</span>
      }
    </button>
  `,
  styleUrl: './tabs-trigger.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsTriggerComponent {
  /** The value this tab selects. */
  readonly value = input.required<string>();
  /** Skipped by the arrow keys and cannot be selected. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Shows a dot (and tells screen readers) that this tab has unread updates. */
  readonly notification = input(false, { transform: booleanAttribute });
}

/** The panel for one tab. Its content renders only while selected, unless `forceMount`. */
@Component({
  selector: 'ds-tabs-content',
  template: `
    @if (content.selected() || forceMount()) {
      <ng-content />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsTabsContent, inputs: ['value'] }],
  styles: `
    :host {
      display: block;
      padding-top: var(--pada-space-4);
    }

    :host([hidden]) {
      display: none;
    }

    :host(:focus-visible) {
      outline: none;
      box-shadow: var(--pada-shadow-focus);
      border-radius: var(--pada-radius-sm);
    }
  `,
})
export class TabsContentComponent {
  protected readonly content = inject(DsTabsContent);
  /** Keep the content rendered (hidden) while inactive, e.g. to preserve form state. */
  readonly forceMount = input(false, { transform: booleanAttribute });
}

/** Every tabs part. */
export const TabsParts = [
  TabsComponent,
  TabsListComponent,
  TabsTriggerComponent,
  TabsContentComponent,
] as const;
