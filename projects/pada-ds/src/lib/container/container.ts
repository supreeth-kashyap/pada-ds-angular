import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

/**
 * Centres page content at a readable maximum width, with side gutters that grow on wider
 * screens. Use the element, or put `dsContainer` on the element you need (React's `as` prop):
 *
 * ```html
 * <main dsContainer size="lg">…</main>
 * ```
 */
@Component({
  selector: 'ds-container, [dsContainer]',
  template: '<ng-content />',
  styleUrl: './container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-size]': 'size()' },
})
export class ContainerComponent {
  /** Maximum width, from the breakpoint tokens; `full` has none. @default 'xl' */
  readonly size = input<ContainerSize>('xl');
}
