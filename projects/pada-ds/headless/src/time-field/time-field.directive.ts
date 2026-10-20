import {
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  linkedSignal,
  model,
  numberAttribute,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { byDocumentOrder, dataFlag, focusElement } from '../utils/dom';
import { injectControlStatus } from '../utils/forms';
import { injectHiddenInputs } from '../utils/form-controls';
import {
  formatTime,
  pad,
  parseTime,
  stepValue,
  timeToSeconds,
  type DayPeriod,
  type TimeParts,
  type TimeSegmentType,
} from './time';

export type { TimeSegmentType, DayPeriod } from './time';

/** The smallest unit entered: minutes (`HH:mm`) or seconds (`HH:mm:ss`). */
export type TimeGranularity = 'minute' | 'second';
/** 12-hour clock with AM/PM, or 24-hour. */
export type HourCycle = 12 | 24;

/** One piece of the field's layout, in the locale's order: a segment, or literal text (":"). */
export type TimeFieldPart = { type: TimeSegmentType } | { type: 'literal'; text: string };

/** What a segment shows and announces. */
export interface TimeSegmentState {
  type: TimeSegmentType;
  /** The value in the segment's own range (hours 1–12 on a 12-hour clock; 0 = AM, 1 = PM). */
  value: number | null;
  min: number;
  max: number;
  /** Shown text, or the placeholder while empty. */
  text: string;
  /** For `aria-valuetext`. */
  valueText: string;
}

interface SegmentRef {
  type: () => TimeSegmentType;
  element: HTMLElement;
}

const SEGMENT_LABELS: Record<TimeSegmentType, string> = {
  hour: 'Hours',
  minute: 'Minutes',
  second: 'Seconds',
  dayPeriod: 'AM/PM',
};
const REFERENCE = new Date(2000, 0, 1, 13, 5, 6);

/**
 * A time of day entered in segments (hours, minutes, optionally seconds, and AM/PM on a 12-hour
 * clock), each a `spinbutton` (`role="group"` around them). The order, separators and clock
 * follow the locale through `Intl`. The value is a 24-hour `"HH:mm"` (or `"HH:mm:ss"`) string,
 * null until every segment is filled. Works with Angular forms or through `[(value)]`.
 *
 * ```html
 * <div dsTimeField #time="dsTimeField" [(value)]="start" aria-label="Start time">
 *   @for (part of time.layout(); track $index) {
 *     @if (part.type === 'literal') {
 *       <span aria-hidden="true">{{ part.text }}</span>
 *     } @else {
 *       <span [dsTimeSegment]="part.type"></span>
 *     }
 *   }
 * </div>
 * ```
 *
 * Follows the segmented-field pattern of WAI-ARIA APG Spinbutton, like React's headless
 * `TimeField` (`TimeField.Root`, `TimeField.Segment`), where `children` can be a function of
 * the layout instead of `#time.layout()`.
 */
@Directive({
  selector: '[dsTimeField]',
  exportAs: 'dsTimeField',
  host: {
    role: 'group',
    '[attr.data-disabled]': 'flag(isDisabled())',
    '[attr.data-readonly]': 'flag(readOnly())',
    '[attr.data-invalid]': 'flag(outOfRange())',
    '[attr.data-complete]': 'flag(value() !== null)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class DsTimeField implements ControlValueAccessor, OnInit {
  /** The time, `"HH:mm"` or `"HH:mm:ss"` (24-hour), null while incomplete. Two-way bindable. */
  readonly value = model<string | null>(null);
  /** Smallest unit entered. @default 'minute' */
  readonly granularity = input<TimeGranularity>('minute');
  /** 12- or 24-hour clock. Follows the locale when unset. */
  readonly hourCycle = input<HourCycle | undefined>(undefined);
  /** Locale for the segment order, separators, clock and AM/PM names. Defaults to the browser's. */
  readonly locale = input<string | undefined>(undefined);
  /** Minutes the arrow keys step by. @default 1 */
  readonly minuteStep = input(1, { transform: numberAttribute });
  /** Earliest valid time (`"HH:mm"`); a value before it marks the field invalid. */
  readonly min = input<string | undefined>(undefined);
  /** Latest valid time (`"HH:mm"`); a value after it marks the field invalid. */
  readonly max = input<string | undefined>(undefined);
  /** Shown in empty segments. @default '––' */
  readonly placeholder = input('––');
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Segments can be focused but not changed. */
  readonly readOnly = input(false, { transform: booleanAttribute });
  /** Submits the value with a native form under this name. */
  readonly name = input<string>();

  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  /** Disabled through the input or the forms control. */
  readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly flag = dataFlag;

  /** The value this field last emitted: echoing it back keeps a half-entered time as it is. */
  private emitted: string | null | undefined = undefined;
  /** The segments' contents, which may be incomplete. */
  readonly parts = linkedSignal<string | null, TimeParts>({
    source: this.value,
    computation: (value, previous) =>
      previous && value === this.emitted ? previous.value : parseTime(value),
  });

  /** Whether the clock is 12-hour, from `hourCycle` or the locale. */
  readonly twelveHour = computed(() => {
    const cycle = this.hourCycle();
    if (cycle) return cycle === 12;
    const resolved = new Intl.DateTimeFormat(this.locale(), { hour: 'numeric' }).resolvedOptions();
    return resolved.hourCycle === 'h12' || resolved.hourCycle === 'h11';
  });

  /** Segments and separators in the locale's order. */
  readonly layout = computed<TimeFieldPart[]>(() => {
    const parts = new Intl.DateTimeFormat(this.locale(), {
      hour: 'numeric',
      minute: '2-digit',
      second: this.granularity() === 'second' ? '2-digit' : undefined,
      hourCycle: this.twelveHour() ? 'h12' : 'h23',
    }).formatToParts(REFERENCE);
    const layout: TimeFieldPart[] = [];
    for (const part of parts) {
      if (part.type === 'literal') {
        // Separators only between segments; spacing around AM/PM is left to styles.
        const text = part.value.trim();
        if (text && layout.length) layout.push({ type: 'literal', text });
      } else if (
        part.type === 'hour' ||
        part.type === 'minute' ||
        part.type === 'second' ||
        part.type === 'dayPeriod'
      ) {
        layout.push({ type: part.type });
      }
    }
    if (layout[layout.length - 1]?.type === 'literal') layout.pop();
    return layout;
  });

  /** The locale's names for AM and PM. */
  readonly periodLabels = computed<Record<DayPeriod, string>>(() => {
    const format = new Intl.DateTimeFormat(this.locale(), { hour: 'numeric', hourCycle: 'h12' });
    const label = (hour: number, fallback: string) =>
      format.formatToParts(new Date(2000, 0, 1, hour)).find((part) => part.type === 'dayPeriod')
        ?.value ?? fallback;
    return { AM: label(9, 'AM'), PM: label(21, 'PM') };
  });

  /** The value is outside `min`/`max`. */
  readonly outOfRange = computed(() => {
    const value = timeToSeconds(this.value());
    if (value === null) return false;
    const min = timeToSeconds(this.min());
    const max = timeToSeconds(this.max());
    return (min !== null && value < min) || (max !== null && value > max);
  });

  private readonly registered = signal<readonly SegmentRef[]>([]);
  private readonly segmentElements = computed(() =>
    this.registered()
      .map((segment) => segment.element)
      .sort(byDocumentOrder),
  );

  constructor() {
    injectHiddenInputs(() => ({
      name: this.name(),
      values: [this.value() ?? ''],
      disabled: this.isDisabled(),
    }));
  }

  ngOnInit() {
    this.status.connect();
  }

  /** What a segment shows and announces. */
  segmentState(type: TimeSegmentType): TimeSegmentState {
    const parts = this.parts();
    const twelve = this.twelveHour();
    const placeholder = this.placeholder();
    if (type === 'dayPeriod') {
      const labels = this.periodLabels();
      const period = parts.period;
      return {
        type,
        value: period === null ? null : period === 'AM' ? 0 : 1,
        min: 0,
        max: 1,
        text: period ? labels[period] : placeholder,
        valueText: period ? labels[period] : 'Empty',
      };
    }
    const { min, max } = this.range(type);
    let value: number | null = type === 'hour' ? parts.hour : parts[type];
    if (type === 'hour' && value !== null && twelve) value = value % 12 || 12;
    const text =
      value === null ? placeholder : type === 'hour' && twelve ? String(value) : pad(value);
    return { type, value, min, max, text, valueText: value === null ? 'Empty' : String(value) };
  }

  /** Default accessible name of a segment. */
  segmentLabel(type: TimeSegmentType) {
    return SEGMENT_LABELS[type];
  }

  /** Sets a segment (hours in the segment's own range), or empties it with null. */
  setSegment(type: TimeSegmentType, value: number | null) {
    if (this.isDisabled() || this.readOnly()) return;
    const parts = { ...this.parts() };
    if (type === 'dayPeriod') {
      parts.period = value === null ? null : value === 0 ? 'AM' : 'PM';
      if (parts.hour !== null && parts.period)
        parts.hour = (parts.hour % 12) + (parts.period === 'PM' ? 12 : 0);
    } else if (type === 'hour') {
      parts.hour =
        value === null
          ? null
          : this.twelveHour()
            ? (value % 12) + (parts.period === 'PM' ? 12 : 0)
            : value;
      if (parts.hour !== null && !this.twelveHour()) parts.period = parts.hour >= 12 ? 'PM' : 'AM';
    } else {
      parts[type] = value;
    }
    this.parts.set(parts);
    this.sync(parts);
  }

  /** Steps a segment up or down (`page` for the larger step), wrapping around. */
  stepSegment(type: TimeSegmentType, direction: 1 | -1, page = false) {
    const { value, min, max } = this.segmentState(type);
    if (type === 'dayPeriod') return this.setSegment(type, value === null ? 0 : 1 - value);
    const step =
      type === 'minute'
        ? Math.max(1, page ? Math.max(15, this.minuteStep()) : this.minuteStep())
        : page
          ? type === 'hour'
            ? 2
            : 15
          : 1;
    this.setSegment(type, stepValue(value, direction, step, min, max));
  }

  /** Sets a segment to its lowest (`'min'`) or highest value. */
  setSegmentToEnd(type: TimeSegmentType, end: 'min' | 'max') {
    const { min, max } = this.segmentState(type);
    if (end === 'min') return this.setSegment(type, min);
    const step = type === 'minute' ? Math.max(1, this.minuteStep()) : 1;
    this.setSegment(type, max - ((max - min) % step));
  }

  /** Empties every segment and sets the value. */
  reset(value: string | null) {
    this.emitted = undefined;
    this.value.set(value);
    this.parts.set(parseTime(value));
  }

  /** Focuses the segment `offset` places from `from` (or the first one). */
  focusSegment(from: HTMLElement | null, offset: number) {
    const elements = this.segmentElements();
    const index = from ? elements.indexOf(from) : 0;
    focusElement(elements[Math.min(elements.length - 1, Math.max(0, index + offset))]);
  }

  /** @internal */
  register(segment: SegmentRef) {
    this.registered.update((segments) => [...segments, segment]);
  }
  /** @internal */
  unregister(segment: SegmentRef) {
    this.registered.update((segments) => segments.filter((entry) => entry !== segment));
  }

  private range(type: Exclude<TimeSegmentType, 'dayPeriod'>) {
    if (type === 'hour') return this.twelveHour() ? { min: 1, max: 12 } : { min: 0, max: 23 };
    return { min: 0, max: 59 };
  }

  private sync(parts: TimeParts) {
    const withSeconds = this.granularity() === 'second';
    const complete =
      parts.hour !== null &&
      parts.minute !== null &&
      (!withSeconds || parts.second !== null) &&
      (!this.twelveHour() || parts.period !== null);
    const next = complete
      ? formatTime(parts.hour!, parts.minute!, withSeconds ? parts.second : null)
      : null;
    if (next === this.value()) return;
    this.emitted = next;
    this.value.set(next);
    this.onChange(next);
  }

  protected onFocusOut(event: FocusEvent) {
    const host = (event.currentTarget as HTMLElement | null) ?? null;
    if (!host?.contains(event.relatedTarget as Node | null)) this.onTouched();
  }

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null | undefined): void {
    this.reset(value ?? null);
  }
  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}

/**
 * One segment (`role="spinbutton"`): ArrowUp/ArrowDown step it (wrapping), PageUp/PageDown by a
 * larger step, Home/End to its lowest and highest values, digits type into it (moving on once it
 * is full), A/P (the first letter of the locale's names) set AM/PM, Backspace and Delete empty
 * it, ArrowLeft/ArrowRight move between segments. The segment renders its own text.
 */
@Directive({
  selector: '[dsTimeSegment]',
  host: {
    role: 'spinbutton',
    '[attr.tabindex]': 'field.isDisabled() ? null : 0',
    '[attr.aria-label]': 'label() ?? field.segmentLabel(type())',
    '[attr.aria-valuenow]': 'state().value',
    '[attr.aria-valuemin]': 'state().min',
    '[attr.aria-valuemax]': 'state().max',
    '[attr.aria-valuetext]': 'state().valueText',
    '[attr.aria-disabled]': 'field.isDisabled() || null',
    '[attr.aria-readonly]': 'field.readOnly() || null',
    '[attr.aria-invalid]': 'field.outOfRange() || null',
    '[attr.data-type]': 'type()',
    '[attr.data-placeholder]': 'flag(state().value === null)',
    '[textContent]': 'state().text',
    '(keydown)': 'onKeyDown($event)',
    '(focus)': 'buffer = ""',
  },
})
export class DsTimeSegment implements OnInit, OnDestroy {
  protected readonly field = inject(DsTimeField);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Which part of the time this segment holds. */
  readonly type = input.required<TimeSegmentType>({ alias: 'dsTimeSegment' });
  /** Accessible name. @default 'Hours', 'Minutes', 'Seconds' or 'AM/PM' */
  readonly label = input<string | undefined>(undefined);

  /** The segment's value, range and text. */
  readonly state = computed(() => this.field.segmentState(this.type()));
  protected readonly flag = dataFlag;
  protected buffer = '';
  private readonly ref: SegmentRef = { type: this.type, element: this.element };

  ngOnInit() {
    this.field.register(this.ref);
  }
  ngOnDestroy() {
    this.field.unregister(this.ref);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const field = this.field;
    const type = this.type();
    const rtl = getComputedStyle(this.element).direction === 'rtl';
    const editable = !field.isDisabled() && !field.readOnly();
    const actions: Record<string, () => void> = {
      ArrowUp: () => editable && field.stepSegment(type, 1),
      ArrowDown: () => editable && field.stepSegment(type, -1),
      PageUp: () => editable && field.stepSegment(type, 1, true),
      PageDown: () => editable && field.stepSegment(type, -1, true),
      Home: () => editable && field.setSegmentToEnd(type, 'min'),
      End: () => editable && field.setSegmentToEnd(type, 'max'),
      ArrowLeft: () => field.focusSegment(this.element, rtl ? 1 : -1),
      ArrowRight: () => field.focusSegment(this.element, rtl ? -1 : 1),
      Backspace: () => editable && this.erase(true),
      Delete: () => editable && this.erase(false),
    };
    const action = actions[event.key];
    if (action) {
      event.preventDefault();
      this.buffer = '';
      action();
      return;
    }
    if (!editable || event.key.length !== 1) return;
    if (type === 'dayPeriod') this.typePeriod(event);
    else if (/\d/.test(event.key)) {
      event.preventDefault();
      this.typeDigit(event.key);
    }
  }

  private typeDigit(digit: string) {
    const { min, max } = this.state();
    let buffer = this.buffer + digit;
    if (Number(buffer) > max) buffer = digit;
    const value = Number(buffer);
    if (value < min) {
      // "0" on a 12-hour clock: wait for the next digit.
      this.buffer = buffer.length >= 2 ? '' : buffer;
      return;
    }
    this.field.setSegment(this.type(), value);
    if (buffer.length >= 2 || value * 10 > max) {
      this.buffer = '';
      this.field.focusSegment(this.element, 1);
    } else {
      this.buffer = buffer;
    }
  }

  private typePeriod(event: KeyboardEvent) {
    const key = event.key.toLocaleLowerCase();
    const labels = this.field.periodLabels();
    const match = (label: string, fallback: string) =>
      key === label.charAt(0).toLocaleLowerCase() || key === fallback;
    const period = match(labels.AM, 'a') ? 0 : match(labels.PM, 'p') ? 1 : null;
    if (period === null) return;
    event.preventDefault();
    this.field.setSegment('dayPeriod', period);
    this.field.focusSegment(this.element, 1);
  }

  private erase(backspace: boolean) {
    if (this.state().value === null) {
      if (backspace) this.field.focusSegment(this.element, -1);
      return;
    }
    this.field.setSegment(this.type(), null);
  }
}

/** Every time field part, for `imports: [DsTimeFieldParts]`. */
export const DsTimeFieldParts = [DsTimeField, DsTimeSegment] as const;
