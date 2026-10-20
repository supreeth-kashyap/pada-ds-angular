import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  TemplateRef,
  Type,
} from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { uniqueId } from 'pada-ds-angular/headless';
import { AvatarComponent } from '../avatar/avatar';
import { BadgeComponent, BadgeTone } from '../badge/badge';
import { ButtonComponent } from '../button/button';
import { InfoTooltipComponent } from '../info-tooltip/info-tooltip';

/** One value in a row. A row shows its values side by side, wrapping as needed. */
export type DescriptionListValue =
  | { type: 'text'; text: string }
  | { type: 'avatar'; name: string; initials?: string; src?: string; subtitle?: string }
  | { type: 'badge'; label: string; tone?: BadgeTone }
  | { type: 'button'; label: string; disabled?: boolean }
  | { type: 'custom'; component: Type<unknown>; inputs?: Record<string, unknown> }
  | { type: 'template'; template: TemplateRef<unknown>; context?: unknown };

/** A term and its values. */
export interface DescriptionListRow {
  key: string;
  /** Help text behind an info button next to the key. */
  tooltip?: string;
  value: DescriptionListValue[];
}

/** An item at the end of a section header. */
export type DescriptionListSlotItem =
  | { type: 'button'; label: string; disabled?: boolean }
  | { type: 'badge'; label: string; tone?: BadgeTone };

export interface DescriptionListHeader {
  label: string;
  /** Help text behind an info button next to the label. */
  tooltip?: string;
  slot?: DescriptionListSlotItem[];
}

export interface DescriptionListSection {
  header: DescriptionListHeader;
  rows: DescriptionListRow[];
}

export interface DescriptionListData {
  sections: DescriptionListSection[];
}

/** Which button was pressed in a row: its label and its position in the row's `value`. */
export interface DescriptionListRowButtonClick {
  label: string;
  index: number;
}

export type DescriptionListEvent =
  | { type: 'section-slot-click'; sectionLabel: string; item: DescriptionListSlotItem }
  | {
      type: 'row-button-click';
      sectionLabel: string;
      key: string;
      label: string;
      index: number;
    };

type ResolvedValue =
  | { kind: 'text'; text: string }
  | { kind: 'avatar'; value: Extract<DescriptionListValue, { type: 'avatar' }> }
  | { kind: 'badge'; label: string; tone: BadgeTone }
  | { kind: 'button'; label: string; disabled: boolean; index: number }
  | { kind: 'component'; component: Type<unknown>; inputs: Record<string, unknown> }
  | { kind: 'template'; template: TemplateRef<unknown>; context: unknown };

const resolveValue = (value: DescriptionListValue, index: number): ResolvedValue => {
  switch (value.type) {
    case 'text':
      return { kind: 'text', text: value.text };
    case 'avatar':
      return { kind: 'avatar', value };
    case 'badge':
      return { kind: 'badge', label: value.label, tone: value.tone ?? 'neutral' };
    case 'button':
      return { kind: 'button', label: value.label, disabled: value.disabled ?? false, index };
    case 'custom':
      return { kind: 'component', component: value.component, inputs: value.inputs ?? {} };
    case 'template':
      return { kind: 'template', template: value.template, context: value.context ?? null };
  }
};

/**
 * A section header: the label, an optional info tooltip, and buttons or badges at the end.
 * Rendered by `ds-description-list`.
 */
@Component({
  selector: 'ds-description-list-header',
  imports: [BadgeComponent, ButtonComponent, InfoTooltipComponent],
  template: `
    <div class="description-list-header-title">
      <span class="description-list-header-label" [id]="labelId()">{{ data().label }}</span>
      @if (data().tooltip; as tooltip) {
        <ds-info-tooltip [data]="{ label: data().label, text: tooltip }" />
      }
    </div>
    @if (data().slot?.length) {
      <div class="description-list-header-slot">
        @for (item of data().slot; track $index) {
          @if (item.type === 'button') {
            <button
              dsButton
              variant="secondary"
              size="sm"
              [disabled]="item.disabled ?? false"
              (click)="slotClicked.emit(item)"
            >
              {{ item.label }}
            </button>
          } @else {
            <ds-badge [tone]="item.tone ?? 'neutral'">{{ item.label }}</ds-badge>
          }
        }
      </div>
    }
  `,
  styleUrl: './description-list-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionListHeaderComponent {
  /** The header to show. */
  readonly data = input.required<DescriptionListHeader>();
  /** Id for the label element, so the section can be named by it. */
  readonly labelId = input<string>();
  /** A slot button was pressed. */
  readonly slotClicked = output<DescriptionListSlotItem>();
}

/**
 * One row: a `<dt>` with the key (and tooltip) and a `<dd>` with the values. Goes on a `<div>`
 * inside a `<dl>`; rendered by `ds-description-list`.
 */
@Component({
  selector: 'div[dsDescriptionListRow]',
  imports: [
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    InfoTooltipComponent,
    NgComponentOutlet,
    NgTemplateOutlet,
  ],
  template: `
    <dt class="description-list-key">
      <span class="description-list-key-text">{{ data().key }}</span>
      @if (data().tooltip; as tooltip) {
        <ds-info-tooltip [data]="{ label: data().key, text: tooltip }" />
      }
    </dt>
    <dd class="description-list-value">
      @for (value of values(); track $index) {
        @switch (value.kind) {
          @case ('text') {
            <span class="description-list-text">{{ value.text }}</span>
          }
          @case ('avatar') {
            <span class="description-list-avatar">
              <!-- The name is right next to it, so the picture is not announced twice. -->
              <span class="description-list-avatar-picture" aria-hidden="true">
                <ds-avatar
                  [name]="value.value.name"
                  [src]="value.value.src"
                  [initials]="value.value.initials"
                />
              </span>
              <span class="description-list-avatar-info">
                <span class="description-list-avatar-name">{{ value.value.name }}</span>
                @if (value.value.subtitle) {
                  <span class="description-list-avatar-subtitle">{{ value.value.subtitle }}</span>
                }
              </span>
            </span>
          }
          @case ('badge') {
            <ds-badge [tone]="value.tone">{{ value.label }}</ds-badge>
          }
          @case ('button') {
            <button
              dsButton
              variant="secondary"
              size="sm"
              [disabled]="value.disabled"
              (click)="buttonClicked.emit({ label: value.label, index: value.index })"
            >
              {{ value.label }}
            </button>
          }
          @case ('component') {
            <ng-container *ngComponentOutlet="value.component; inputs: value.inputs" />
          }
          @case ('template') {
            <ng-container *ngTemplateOutlet="value.template; context: $any(value.context)" />
          }
        }
      }
    </dd>
  `,
  styleUrl: './description-list-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionListRowComponent {
  /** The row to show. */
  readonly data = input.required<DescriptionListRow>();
  /** A button value was pressed. */
  readonly buttonClicked = output<DescriptionListRowButtonClick>();

  // Resolved once per `data` change, so outlet inputs keep their identity across renders.
  protected readonly values = computed(() => this.data().value.map(resolveValue));
}

/**
 * Sections of terms and values (a record's attributes), from data: a header per section, then
 * a description list (`dl`, `dt`, `dd`) of rows. Values can be text, an avatar with a name, a
 * badge, a button, your own component or a template.
 *
 * ```html
 * <ds-description-list [data]="details" (action)="onAction($event)" />
 * ```
 *
 * ```ts
 * details: DescriptionListData = {
 *   sections: [{
 *     header: { label: 'Ownership', slot: [{ type: 'button', label: 'Edit' }] },
 *     rows: [
 *       { key: 'Owner', value: [{ type: 'avatar', name: 'Anna Banks', subtitle: 'HR' }] },
 *       { key: 'Status', tooltip: 'Current state', value: [{ type: 'badge', label: 'Active', tone: 'success' }] },
 *     ],
 *   }],
 * };
 * ```
 *
 * Every button press comes out of `action`, with the section label (and the row key, button
 * label and position for row buttons). An Angular-only component: React has no equivalent.
 */
@Component({
  selector: 'ds-description-list',
  imports: [DescriptionListHeaderComponent, DescriptionListRowComponent],
  template: `
    @for (section of data().sections; track $index; let index = $index) {
      <div class="description-list-section" role="group" [attr.aria-labelledby]="idPrefix + index">
        <ds-description-list-header
          [data]="section.header"
          [labelId]="idPrefix + index"
          (slotClicked)="onSlotClicked(section.header.label, $event)"
        />
        <dl class="description-list-rows">
          @for (row of section.rows; track $index) {
            <div
              dsDescriptionListRow
              [data]="row"
              (buttonClicked)="onRowButtonClicked(section.header.label, row.key, $event)"
            ></div>
          }
        </dl>
      </div>
    }
  `,
  styleUrl: './description-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionListComponent {
  /** The sections to show. */
  readonly data = input.required<DescriptionListData>();
  /** A header slot button or a row button was pressed. */
  readonly action = output<DescriptionListEvent>();

  protected readonly idPrefix = `${uniqueId('ds-description-list-')}-section-`;

  protected onSlotClicked(sectionLabel: string, item: DescriptionListSlotItem) {
    this.action.emit({ type: 'section-slot-click', sectionLabel, item });
  }

  protected onRowButtonClicked(
    sectionLabel: string,
    key: string,
    click: DescriptionListRowButtonClick,
  ) {
    this.action.emit({ type: 'row-button-click', sectionLabel, key, ...click });
  }
}

/** The description list and its parts. */
export const DescriptionListParts = [
  DescriptionListComponent,
  DescriptionListHeaderComponent,
  DescriptionListRowComponent,
] as const;
