import type { TimelineData, TimelineItemData, TimelineTone } from './timeline';

/** An event as APIs commonly return it (activity feeds, audit logs, order history). */
export interface TimelineApiEvent {
  id?: string | number | null;
  title?: string | null;
  /** ISO date-time, epoch milliseconds, or display text. */
  timestamp?: string | number | null;
  description?: string | null;
  icon?: string | null;
  /** Free-form status, mapped to a tone: success/done/completed, warning, error/failed, info/active. */
  status?: string | null;
  /** Not happened yet (a scheduled step). */
  pending?: boolean | null;
}

const TONES: Record<string, TimelineTone> = {
  success: 'success',
  done: 'success',
  completed: 'success',
  warning: 'warning',
  error: 'danger',
  failed: 'danger',
  danger: 'danger',
  info: 'accent',
  active: 'accent',
  accent: 'accent',
};

const toTime = (timestamp: string | number | null | undefined): Date | string | undefined => {
  if (timestamp === null || timestamp === undefined || timestamp === '') return undefined;
  const date = new Date(timestamp);
  // Strings that are not dates ("2 hours ago") are shown as they are.
  return Number.isNaN(date.getTime()) ||
    (typeof timestamp === 'string' && !/\d{4}-\d{2}/.test(timestamp))
    ? String(timestamp)
    : date;
};

const toItem = (event: TimelineApiEvent, index: number): TimelineItemData => {
  const time = toTime(event.timestamp);
  const tone = event.status ? TONES[event.status.toLowerCase()] : undefined;
  return {
    id: event.id === null || event.id === undefined ? String(index) : String(event.id),
    title: event.title?.trim() || 'Untitled event',
    ...(time !== undefined ? { time } : {}),
    ...(event.description ? { description: event.description } : {}),
    ...(event.icon ? { icon: event.icon } : {}),
    ...(tone ? { tone } : {}),
    ...(event.pending ? { pending: true } : {}),
  };
};

/** Maps API events to `ds-timeline` data: dates parsed, statuses mapped to tones, blanks dropped. */
export function toTimelineData(
  events: readonly TimelineApiEvent[] | null | undefined,
): TimelineData {
  return { items: (events ?? []).map(toItem) };
}
