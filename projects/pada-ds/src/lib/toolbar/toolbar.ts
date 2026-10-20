import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DsToolbar, DsToolbarItem } from 'pada-ds-angular/headless';
import { ButtonComponent, ButtonVariant } from '../button/button';
import { FilterComponent } from './filter';
import { FilterChipComponent } from './filter-chip';
import { MoreFilterComponent } from './more-filter';

/** A button at the end of a `ds-toolbar`. */
export interface ToolbarAction {
  /** Stable id; what `action` reports. */
  id: string;
  label: string;
  /** @default 'ghost' for `actions`, 'secondary' for `primaryAction` */
  variant?: ButtonVariant;
  /** Built-in icon name before the label. */
  leftIcon?: string;
  /** Built-in icon name after the label. */
  rightIcon?: string;
  disabled?: boolean;
  /** Accessible name, for icon-only buttons. */
  ariaLabel?: string;
}

/**
 * A toolbar (WAI-ARIA APG Toolbar): filters and a view switcher on the left, buttons on the
 * right. It is one tab stop; Left/Right (and Home/End) move between its items, skipping
 * disabled ones. The chips of `ds-filter`, `ds-more-filter` and `ds-filter-chip` are items; mark
 * your own buttons with `dsToolbarItem`. Name it with `aria-label`.
 *
 * ```html
 * <ds-toolbar aria-label="Members" [actions]="[{ id: 'export', label: 'Export' }]"
 *             [primaryAction]="{ id: 'invite', label: 'Invite' }" (action)="run($event)">
 *   <ds-filter label="Status" [options]="statuses" [(value)]="status" />
 *   <ds-more-filter [filters]="more" [(value)]="extra" />
 * </ds-toolbar>
 * ```
 *
 * The projected content is the left cluster; `actions` and `primaryAction` render the right
 * cluster as `dsButton`s. Without them the toolbar is a single wrapping row.
 *
 * Differences from React: the toolbar has `role="toolbar"` and roving focus (React's is a plain
 * flex container); the left cluster is projected content instead of a `left` prop; actions are
 * data (`ToolbarAction`, with `action` reporting the id) instead of `ButtonProps` with
 * `onClick`; the legacy children-only mode is the same projected content without actions.
 */
@Component({
  selector: 'ds-toolbar',
  imports: [ButtonComponent, DsToolbarItem],
  template: `
    <div class="toolbar-cluster toolbar-cluster-start"><ng-content /></div>
    @if (split()) {
      <div class="toolbar-cluster toolbar-cluster-end">
        @for (item of buttons(); track item.id) {
          <button
            dsButton
            dsToolbarItem
            [variant]="item.variant"
            [leftIcon]="item.leftIcon"
            [rightIcon]="item.rightIcon"
            [disabled]="item.disabled"
            [attr.aria-label]="item.ariaLabel"
            (click)="action.emit(item.id)"
          >
            {{ item.label }}
          </button>
        }
      </div>
    }
  `,
  styleUrl: './toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsToolbar, inputs: ['orientation', 'loop', 'dir'] }],
  host: { '[attr.data-layout]': 'split() ? "split" : "single"' },
})
export class ToolbarComponent {
  /** Buttons in the right cluster, before `primaryAction`. */
  readonly actions = input<readonly ToolbarAction[]>([]);
  /** The main call to action, at the far right. */
  readonly primaryAction = input<ToolbarAction>();
  /** An action button was pressed, with its id. */
  readonly action = output<string>();

  protected readonly buttons = computed(() => {
    const primary = this.primaryAction();
    return [
      ...this.actions().map((item) => this.resolve(item, 'ghost')),
      ...(primary ? [this.resolve(primary, 'secondary')] : []),
    ];
  });
  protected readonly split = computed(() => this.buttons().length > 0);

  private resolve(item: ToolbarAction, variant: ButtonVariant) {
    return {
      id: item.id,
      label: item.label,
      variant: item.variant ?? variant,
      leftIcon: item.leftIcon,
      rightIcon: item.rightIcon,
      disabled: item.disabled ?? false,
      ariaLabel: item.ariaLabel ?? null,
    };
  }
}

/** The toolbar and its filter parts, for `imports: [...ToolbarParts]`. */
export const ToolbarParts = [
  ToolbarComponent,
  FilterComponent,
  MoreFilterComponent,
  FilterChipComponent,
  DsToolbarItem,
] as const;
