import {
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  model,
  numberAttribute,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { dataFlag } from '../utils/dom';
import { injectControlStatus } from '../utils/forms';
import { clamp, injectHiddenInputs } from '../utils/form-controls';

export type SliderOrientation = 'horizontal' | 'vertical';

const decimals = (step: number) => (String(step).split('.')[1] ?? '').length;
const snap = (value: number, min: number, step: number) =>
  Number((Math.round((value - min) / step) * step + min).toFixed(decimals(step)));

/** `undefined` stays unset; anything else is a number attribute. */
const optionalNumber = (value: unknown): number | undefined =>
  value === undefined || value === null || value === '' ? undefined : numberAttribute(value);

/**
 * A slider with one or more thumbs (WAI-ARIA APG: Slider, Multi-Thumb Slider). Holds the
 * values and limits; pressing anywhere on it moves the nearest thumb there and drags it.
 * Works with Angular forms (a number array) or through `[(value)]`.
 *
 * ```html
 * <span dsSlider [(value)]="price" [min]="0" [max]="500" [minStepsBetweenThumbs]="5">
 *   <span dsSliderTrack><span dsSliderRange></span></span>
 *   <span dsSliderThumb [index]="0" aria-label="Minimum price"></span>
 *   <span dsSliderThumb [index]="1" aria-label="Maximum price"></span>
 * </span>
 * ```
 *
 * Style the parts with `data-orientation`, `data-disabled` and the custom properties the range
 * and thumbs set (`--pada-slider-range-start`, `--pada-slider-range-end`,
 * `--pada-slider-thumb-position`, all percentages).
 */
@Directive({
  selector: '[dsSlider]',
  exportAs: 'dsSlider',
  host: {
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-disabled]': 'flag(isDisabled())',
    '[attr.dir]': 'dir() ?? null',
    '(pointerdown)': 'handlePointerDown($event)',
    '(pointermove)': 'handlePointerMove($event)',
    '(pointerup)': 'handlePointerUp($event)',
    '(pointercancel)': 'handlePointerUp($event)',
  },
})
export class DsSlider implements ControlValueAccessor, OnInit {
  /** One value per thumb (`[25]`, or `[20, 80]` for a range). Two-way bindable. @default [min] */
  readonly value = model<number[]>([]);
  /** @default 0 */
  readonly min = input(0, { transform: numberAttribute });
  /** @default 100 */
  readonly max = input(100, { transform: numberAttribute });
  /** @default 1 */
  readonly step = input(1, { transform: numberAttribute });
  /** PageUp/PageDown step. @default step × 10 */
  readonly largeStep = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /** Steps kept between neighbouring thumbs. @default 0 */
  readonly minStepsBetweenThumbs = input(0, { transform: numberAttribute });
  /** @default 'horizontal' */
  readonly orientation = input<SliderOrientation>('horizontal');
  /** Reading direction; `rtl` reverses a horizontal slider. Set on the element when given. */
  readonly dir = input<'ltr' | 'rtl'>();
  /** Disables every thumb. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Submits each thumb's value with a native form under this name (repeated). */
  readonly name = input<string>();
  /** A drag ended or a key press changed the value. */
  readonly valueCommit = output<number[]>();

  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Disabled through the input or the forms control. */
  readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  /** The thumb values (`[min]` while `value` is empty). */
  readonly values = computed(() => {
    const values = this.value();
    return values.length ? values : [this.min()];
  });
  /** The PageUp/PageDown step. */
  readonly bigStep = computed(() => this.largeStep() ?? this.step() * 10);
  /** The track element, registered by `dsSliderTrack`; pointer positions are measured on it. */
  readonly track = signal<HTMLElement | null>(null);
  protected readonly flag = dataFlag;

  private activeThumb = 0;
  private dragging = false;
  private onChange: (value: number[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    injectHiddenInputs(() => ({
      name: this.name(),
      values: this.values().map(String),
      disabled: this.isDisabled(),
    }));
  }

  ngOnInit() {
    this.status.connect();
  }

  /** Where a value sits along the track, in percent. */
  percent(value: number): number {
    return ((value - this.min()) / (this.max() - this.min() || 1)) * 100;
  }

  /** How far a thumb can move: up to its neighbours (minus the gap), else the limits. */
  bounds(index: number, values = this.values()): [number, number] {
    const gap = this.minStepsBetweenThumbs() * this.step();
    const low = index > 0 ? values[index - 1] + gap : this.min();
    const high = index < values.length - 1 ? values[index + 1] - gap : this.max();
    return [low, high];
  }

  /** Moves one thumb (snapped to the step, kept in order and apart); `commit` also emits `valueCommit`. */
  setThumb(index: number, raw: number, commit = false) {
    const current = this.values();
    const [low, high] = this.bounds(index, current);
    const next = clamp(snap(raw, this.min(), this.step()), low, high);
    if (next !== current[index]) {
      const updated = current.map((value, position) => (position === index ? next : value));
      this.value.set(updated);
      this.onChange(updated);
    }
    if (commit) this.valueCommit.emit(this.values());
  }

  /** @internal A thumb received focus. */
  setActiveThumb(index: number) {
    this.activeThumb = index;
  }
  /** @internal A thumb lost focus. */
  markTouched() {
    this.onTouched();
  }

  // The value under the pointer, measured along the track.
  private valueAt(event: PointerEvent) {
    const box = (this.track() ?? this.element).getBoundingClientRect();
    const horizontal = this.orientation() === 'horizontal';
    let ratio = horizontal
      ? (event.clientX - box.left) / (box.width || 1)
      : 1 - (event.clientY - box.top) / (box.height || 1);
    if (horizontal && this.dir() === 'rtl') ratio = 1 - ratio;
    return this.min() + clamp(ratio, 0, 1) * (this.max() - this.min());
  }

  protected handlePointerDown(event: PointerEvent) {
    if (this.isDisabled() || event.button !== 0) return;
    const value = this.valueAt(event);
    const values = this.values();
    // The nearest thumb moves there; when thumbs overlap, the one on the side being dragged to.
    let index = 0;
    values.forEach((thumb, position) => {
      const distance = Math.abs(thumb - value);
      const best = Math.abs(values[index] - value);
      if (distance < best || (distance === best && value > thumb)) index = position;
    });
    this.activeThumb = index;
    this.dragging = true;
    try {
      this.element.setPointerCapture?.(event.pointerId);
    } catch {
      // The pointer is already gone; the drag still works while it stays over the slider.
    }
    this.setThumb(index, value);
    const thumbs = this.element.querySelectorAll<HTMLElement>('[role="slider"]');
    thumbs[index]?.focus({ preventScroll: true });
    event.preventDefault();
  }

  protected handlePointerMove(event: PointerEvent) {
    if (this.dragging) this.setThumb(this.activeThumb, this.valueAt(event));
  }

  protected handlePointerUp(event: PointerEvent) {
    if (!this.dragging) return;
    this.dragging = false;
    try {
      this.element.releasePointerCapture?.(event.pointerId);
    } catch {
      // Already released.
    }
    this.valueCommit.emit(this.values());
  }

  writeValue(value: number[] | null): void {
    this.value.set(value ?? []);
  }
  registerOnChange(fn: (value: number[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}

/** The line the thumbs move along. Pressing anywhere on the slider moves the nearest thumb. */
@Directive({
  selector: '[dsSliderTrack]',
  host: {
    '[attr.data-orientation]': 'slider.orientation()',
    '[attr.data-disabled]': 'flag(slider.isDisabled())',
  },
})
export class DsSliderTrack implements OnInit, OnDestroy {
  protected readonly slider = inject(DsSlider);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly flag = dataFlag;
  ngOnInit() {
    this.slider.track.set(this.element);
  }
  ngOnDestroy() {
    if (this.slider.track() === this.element) this.slider.track.set(null);
  }
}

/**
 * The filled part of the track: from the start to the thumb (one thumb) or between the first
 * and last thumbs. Sets `--pada-slider-range-start` and `--pada-slider-range-end` (percent).
 */
@Directive({
  selector: '[dsSliderRange]',
  host: {
    '[attr.data-orientation]': 'slider.orientation()',
    '[style.--pada-slider-range-start]': 'start()',
    '[style.--pada-slider-range-end]': 'end()',
  },
})
export class DsSliderRange {
  protected readonly slider = inject(DsSlider);
  protected readonly start = computed(() => {
    const values = this.slider.values();
    return `${values.length > 1 ? this.slider.percent(Math.min(...values)) : 0}%`;
  });
  protected readonly end = computed(
    () => `${this.slider.percent(Math.max(...this.slider.values()))}%`,
  );
}

/**
 * One thumb: `role="slider"`. Arrow keys step, PageUp/PageDown take a large step, Home/End
 * jump as far as the neighbouring thumbs allow. Sets `--pada-slider-thumb-position` (percent).
 * Name each thumb with `aria-label` ("Minimum price", "Maximum price").
 */
@Directive({
  selector: '[dsSliderThumb]',
  exportAs: 'dsSliderThumb',
  host: {
    role: 'slider',
    '[attr.tabindex]': 'slider.isDisabled() ? null : 0',
    '[attr.aria-valuenow]': 'current()',
    '[attr.aria-valuemin]': 'bounds()[0]',
    '[attr.aria-valuemax]': 'bounds()[1]',
    '[attr.aria-orientation]': 'slider.orientation()',
    '[attr.aria-disabled]': 'slider.isDisabled() || null',
    '[attr.data-orientation]': 'slider.orientation()',
    '[attr.data-disabled]': 'flag(slider.isDisabled())',
    '[attr.data-index]': 'index()',
    '[style.--pada-slider-thumb-position]': 'position()',
    '(keydown)': 'handleKeydown($event)',
    '(focus)': 'slider.setActiveThumb(index())',
    '(blur)': 'slider.markTouched()',
  },
})
export class DsSliderThumb {
  protected readonly slider = inject(DsSlider);
  /** Which value this thumb controls. @default 0 */
  readonly index = input(0, { transform: numberAttribute });

  /** This thumb's value. */
  readonly current = computed(() => this.slider.values()[this.index()] ?? this.slider.min());
  /** How far this thumb can move. */
  readonly bounds = computed(() => this.slider.bounds(this.index()));
  protected readonly position = computed(() => `${this.slider.percent(this.current())}%`);
  protected readonly flag = dataFlag;

  protected handleKeydown(event: KeyboardEvent) {
    if (this.slider.isDisabled()) return;
    const value = this.current();
    const step = this.slider.step();
    const [low, high] = this.bounds();
    const forward =
      this.slider.orientation() === 'horizontal' && this.slider.dir() === 'rtl'
        ? 'ArrowLeft'
        : 'ArrowRight';
    const backward = forward === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight';
    const moves: Record<string, number> = {
      [forward]: value + step,
      [backward]: value - step,
      ArrowUp: value + step,
      ArrowDown: value - step,
      PageUp: value + this.slider.bigStep(),
      PageDown: value - this.slider.bigStep(),
      Home: low,
      End: high,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    this.slider.setThumb(this.index(), moves[event.key], true);
  }
}

/** Every slider part, for `imports: [DsSliderParts]`. */
export const DsSliderParts = [DsSlider, DsSliderTrack, DsSliderRange, DsSliderThumb] as const;
