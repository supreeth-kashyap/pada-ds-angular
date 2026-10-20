import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * A bordered surface that groups related content.
 *
 * ```html
 * <ds-card>
 *   <h3>Usage</h3>
 *   <p>42 of 50 seats used.</p>
 * </ds-card>
 * ```
 */
@Component({
  selector: 'ds-card',
  template: '<ng-content />',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {}
