import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  DsAccordion,
  DsAccordionContent,
  DsAccordionHeader,
  DsAccordionItem,
  DsAccordionTrigger,
  DsCollapsible,
} from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * Collapsible sections (WAI-ARIA APG Accordion): `type="single"` (optionally `collapsible`) or
 * `type="multiple"`. Arrow keys and Home/End move between the headers; each header is a button
 * inside a heading, and the content's height animates open and closed.
 *
 * ```html
 * <ds-accordion type="single" collapsible [(value)]="open">
 *   <ds-accordion-item value="install">
 *     <ds-accordion-trigger iconName="download_2">Install</ds-accordion-trigger>
 *     <ds-accordion-content>npm install pada-ds-angular</ds-accordion-content>
 *   </ds-accordion-item>
 *   <ds-accordion-item value="use">
 *     <ds-accordion-trigger>Use</ds-accordion-trigger>
 *     <ds-accordion-content>Import a component</ds-accordion-content>
 *   </ds-accordion-item>
 * </ds-accordion>
 * ```
 *
 * For one standalone section (the React 1.x `<Accordion header>` API), use
 * `ds-accordion-section`. Differences from React: `value` is one model for both types (a string
 * for `single`, an array for `multiple`), and the standalone section is its own element.
 */
@Component({
  selector: 'ds-accordion',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: DsAccordion,
      inputs: ['type', 'value', 'collapsible', 'disabled', 'orientation', 'dir'],
      outputs: ['valueChange'],
    },
  ],
  styles: ':host { display: flex; flex-direction: column; }',
})
export class AccordionComponent {}

/** One section: a `ds-accordion-trigger` and its `ds-accordion-content`. */
@Component({
  selector: 'ds-accordion-item',
  template: '<ng-content />',
  styleUrl: './accordion-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: DsAccordionItem, inputs: ['value', 'disabled'] }],
})
export class AccordionItemComponent {}

/** The section's heading and toggle button, with an optional leading icon and a chevron. */
@Component({
  selector: 'ds-accordion-trigger',
  imports: [NgTemplateOutlet, IconComponent, DsAccordionHeader, DsAccordionTrigger],
  template: `
    <ng-template #inner>
      @if (iconName(); as name) {
        <span class="accordion-header__icon" aria-hidden="true">
          <ds-icon [name]="name" [size]="20" />
        </span>
      }
      <span class="accordion-header__title"><ng-content /></span>
      <span class="accordion-header__chevron" aria-hidden="true">
        <ds-icon name="chevron_down" [size]="20" />
      </span>
    </ng-template>
    @switch (headingLevel()) {
      @case (2) {
        <h2 dsAccordionHeader class="accordion-heading">
          <button dsAccordionTrigger class="accordion-header">
            <ng-container [ngTemplateOutlet]="inner" />
          </button>
        </h2>
      }
      @case (4) {
        <h4 dsAccordionHeader class="accordion-heading">
          <button dsAccordionTrigger class="accordion-header">
            <ng-container [ngTemplateOutlet]="inner" />
          </button>
        </h4>
      }
      @case (5) {
        <h5 dsAccordionHeader class="accordion-heading">
          <button dsAccordionTrigger class="accordion-header">
            <ng-container [ngTemplateOutlet]="inner" />
          </button>
        </h5>
      }
      @case (6) {
        <h6 dsAccordionHeader class="accordion-heading">
          <button dsAccordionTrigger class="accordion-header">
            <ng-container [ngTemplateOutlet]="inner" />
          </button>
        </h6>
      }
      @default {
        <h3 dsAccordionHeader class="accordion-heading">
          <button dsAccordionTrigger class="accordion-header">
            <ng-container [ngTemplateOutlet]="inner" />
          </button>
        </h3>
      }
    }
  `,
  styleUrl: './accordion-trigger.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionTriggerComponent {
  /** Built-in icon name shown before the title. */
  readonly iconName = input<string>();
  /** Level of the heading that wraps the button. @default 3 */
  readonly headingLevel = input<AccordionHeadingLevel>(3);
}

/** The section's content, a region labelled by its trigger; its height animates. */
@Component({
  selector: 'ds-accordion-content',
  template: `
    @if (content.present()) {
      <div class="accordion-content-clip">
        <div class="accordion__body"><ng-content /></div>
      </div>
    }
  `,
  styleUrl: './accordion-content.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [DsAccordionContent],
})
export class AccordionContentComponent {
  protected readonly content = inject(DsAccordionContent);
}

/**
 * One standalone collapsible section: the React 1.x `<Accordion header>` API.
 *
 * ```html
 * <ds-accordion-section header="What is Pada?" headerIconName="help_outline" [(open)]="faq">
 *   A design system.
 * </ds-accordion-section>
 * ```
 */
@Component({
  selector: 'ds-accordion-section',
  imports: [AccordionTriggerComponent, AccordionContentComponent],
  template: `
    <ds-accordion-trigger [iconName]="headerIconName()" [headingLevel]="headingLevel()">
      {{ header() }}
    </ds-accordion-trigger>
    <ds-accordion-content><ng-content /></ds-accordion-content>
  `,
  styleUrl: './accordion-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: DsCollapsible, inputs: ['open', 'disabled'], outputs: ['openChange'] },
  ],
})
export class AccordionSectionComponent {
  /** The header text. */
  readonly header = input.required<string>();
  /** Built-in icon name shown before the header. */
  readonly headerIconName = input<string>();
  /** Level of the heading that wraps the header button. @default 3 */
  readonly headingLevel = input<AccordionHeadingLevel>(3);
}

/** Every accordion part. */
export const AccordionParts = [
  AccordionComponent,
  AccordionItemComponent,
  AccordionTriggerComponent,
  AccordionContentComponent,
  AccordionSectionComponent,
] as const;
