import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon';

export type EmptyStateSize = 'sm' | 'md';
export type EmptyStateHeadingLevel = 2 | 3 | 4;

/**
 * First-use, no-results and error placeholders, with a clear next step.
 *
 * ```html
 * <ds-empty-state media="folder" title="No projects yet" description="Create one to start.">
 *   <button dsButton leftIcon="add">New project</button>
 * </ds-empty-state>
 * ```
 *
 * Projected content becomes the actions. For an illustration instead of an icon, project it
 * with the `dsEmptyStateMedia` attribute.
 *
 * Differences from React: `media` takes an icon name only; other media are projected.
 * `title` sets the heading only: it never becomes the host's native tooltip.
 */
@Component({
  selector: 'ds-empty-state',
  imports: [IconComponent],
  template: `
    <div class="empty-state-media" aria-hidden="true">
      @if (media(); as icon) {
        <ds-icon [name]="icon" [size]="size() === 'sm' ? 24 : 32" />
      }
      <ng-content select="[dsEmptyStateMedia]" />
    </div>
    @switch (headingLevel()) {
      @case (2) {
        <h2 class="empty-state-title">{{ title() }}</h2>
      }
      @case (4) {
        <h4 class="empty-state-title">{{ title() }}</h4>
      }
      @default {
        <h3 class="empty-state-title">{{ title() }}</h3>
      }
    }
    @if (description()) {
      <p class="empty-state-description">{{ description() }}</p>
    }
    <div class="empty-state-actions"><ng-content /></div>
  `,
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'size()',
    '[attr.title]': 'null',
  },
})
export class EmptyStateComponent {
  /** Built-in or Material Symbols icon name shown above the title. */
  readonly media = input<string>();
  /** What is empty, e.g. "No projects yet". */
  readonly title = input.required<string>();
  /** Why it is empty and what to do next. */
  readonly description = input<string>();
  /** `sm` for inside cards and tables, `md` for whole pages. @default 'md' */
  readonly size = input<EmptyStateSize>('md');
  /** Heading level of the title. @default 3 */
  readonly headingLevel = input<EmptyStateHeadingLevel>(3);
}
