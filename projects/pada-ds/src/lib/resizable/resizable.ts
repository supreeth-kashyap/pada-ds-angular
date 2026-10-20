import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { DsResizable, DsResizableHandle, DsResizablePanel } from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

/**
 * Resizable panels: split views, sidebars and inspectors that people can resize (WAI-ARIA APG
 * Window Splitter). Put panels and handles inside in order: panel, handle, panel, …
 *
 * ```html
 * <ds-resizable (sizesCommit)="save($event)">
 *   <ds-resizable-panel [defaultSize]="25" [minSize]="15" collapsible>Files</ds-resizable-panel>
 *   <ds-resizable-handle withGrip aria-label="Resize file list" />
 *   <ds-resizable-panel>Editor</ds-resizable-panel>
 * </ds-resizable>
 * ```
 *
 * Sizes are percentages. Bind `[sizes]` to control them (`[(sizes)]` for two-way binding): a
 * controlled group only moves when new sizes come back, as in React. Restyle through
 * `--pada-resizable-*` tokens. Unlike React, panels and handles find their place by document
 * order, so they need not be direct children.
 */
@Component({
  selector: 'ds-resizable',
  template: '<ng-content />',
  styleUrl: './resizable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: DsResizable,
      inputs: ['orientation', 'sizes', 'keyboardStep', 'disabled'],
      outputs: ['sizesChange', 'sizesCommit'],
    },
  ],
})
export class ResizableComponent {}

/** One panel. `data-state` is `collapsed` or `expanded` for collapsible panels. */
@Component({
  selector: 'ds-resizable-panel',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: DsResizablePanel,
      inputs: ['defaultSize', 'minSize', 'maxSize', 'collapsible', 'collapsedSize'],
    },
  ],
  styles: ':host { display: block; box-sizing: border-box; }',
})
export class ResizablePanelComponent {}

/**
 * The line between two panels. Drag it, or focus it and use the arrow keys; Home and End jump
 * to the limits and Enter collapses a collapsible panel. Named "Resize" unless you give it an
 * `aria-label` or `aria-labelledby`.
 */
@Component({
  selector: 'ds-resizable-handle',
  imports: [IconComponent],
  template: `
    @if (withGrip()) {
      <span class="resizable-grip" aria-hidden="true">
        <ds-icon name="drag_vertical" [size]="12" />
      </span>
    }
  `,
  styleUrl: './resizable-handle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DsResizableHandle],
})
export class ResizableHandleComponent {
  /** Show a grip in the middle of the line, so the handle is easier to find. */
  readonly withGrip = input(false, { transform: booleanAttribute });

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby'))
      element.setAttribute('aria-label', 'Resize');
  }
}

/** Every Resizable part, for `imports`. */
export const ResizableParts = [
  ResizableComponent,
  ResizablePanelComponent,
  ResizableHandleComponent,
] as const;
