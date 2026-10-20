import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import { IconComponent } from '../icon/icon';

export type TimelineTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
export type TimelineDensity = 'compact' | 'comfortable';

/** One event on a timeline. */
export interface TimelineItemData {
  /** Stable id, for tracking. @default its position */
  id?: string;
  title: string;
  /** When it happened: a Date (rendered in a `<time>`) or any text ("2 hours ago"). */
  time?: Date | string;
  /** Built-in icon name inside the marker; a dot when omitted. */
  icon?: string;
  /** Marker colour. @default 'neutral' */
  tone?: TimelineTone;
  /** Still to come: a hollow marker and a dashed connector. */
  pending?: boolean;
  /** Details under the title. */
  description?: string;
}

/** What `ds-timeline` renders: the events, in the order given. */
export interface TimelineData {
  items: TimelineItemData[];
}

/**
 * Custom details for each event, in place of its `description`. The context is the event.
 *
 * ```html
 * <ng-template dsTimelineItemContent let-item><a [href]="links[item.id]">{{ item.description }}</a></ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[dsTimelineItemContent]' })
export class TimelineItemContentDirective {
  readonly template = inject<TemplateRef<{ $implicit: TimelineItemData }>>(TemplateRef);
  static ngTemplateContextGuard(
    _directive: TimelineItemContentDirective,
    _context: unknown,
  ): _context is { $implicit: TimelineItemData } {
    return true;
  }
}

const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/**
 * An ordered list of events (activity feeds, audit logs, order tracking) joined by a line.
 * Events appear one after another on mount; pending events are drawn hollow and dashed.
 *
 * ```html
 * <ds-timeline [data]="{ items: events }" density="compact" />
 * <ds-timeline [data]="toTimelineData(api.history)" />
 * ```
 *
 * Differences from React: events come in one `data` input (`{ items }`, React's `items`), with
 * `toTimelineData` to map an API shape; titles and descriptions are text, and custom details go
 * in an `ng-template dsTimelineItemContent`; React's `Timeline.Item` children API is not ported.
 */
@Component({
  selector: 'ds-timeline',
  imports: [IconComponent, NgTemplateOutlet],
  template: `
    <ol class="timeline">
      @for (item of items(); track item.key) {
        <li
          class="timeline-item"
          [attr.data-tone]="item.tone"
          [attr.data-pending]="item.pending ? '' : null"
          [style.--pada-timeline-index]="$index"
        >
          <span class="timeline-marker" aria-hidden="true">
            @if (item.data.icon; as icon) {
              <ds-icon [name]="icon" [size]="12" />
            } @else {
              <span class="timeline-dot"></span>
            }
          </span>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-title">{{ item.data.title }}</span>
              @if (item.dateTime) {
                <time class="timeline-time" [attr.datetime]="item.dateTime">{{
                  item.timeText
                }}</time>
              } @else if (item.timeText) {
                <span class="timeline-time">{{ item.timeText }}</span>
              }
            </div>
            @if (content(); as custom) {
              <div class="timeline-description">
                <ng-container
                  *ngTemplateOutlet="custom.template; context: { $implicit: item.data }"
                />
              </div>
            } @else if (item.data.description) {
              <div class="timeline-description">{{ item.data.description }}</div>
            }
          </div>
        </li>
      }
    </ol>
  `,
  styleUrl: './timeline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-density]': 'density()' },
})
export class TimelineComponent {
  /** The events. */
  readonly data = input.required<TimelineData>();
  /** Gap between events. @default 'comfortable' */
  readonly density = input<TimelineDensity>('comfortable');

  protected readonly content = contentChild(TimelineItemContentDirective);

  protected readonly items = computed(() =>
    this.data().items.map((data, index) => {
      const time = data.time;
      const isDate = time instanceof Date && !Number.isNaN(time.getTime());
      return {
        key: data.id ?? String(index),
        data,
        tone: data.tone ?? 'neutral',
        pending: !!data.pending,
        dateTime: isDate ? time.toISOString() : null,
        timeText: isDate ? formatter.format(time) : typeof time === 'string' ? time : '',
      };
    }),
  );
}

/** The timeline and its content template, for `imports: [...TimelineParts]`. */
export const TimelineParts = [TimelineComponent, TimelineItemContentDirective] as const;
