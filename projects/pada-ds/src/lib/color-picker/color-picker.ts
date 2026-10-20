import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  model,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { dataFlag, DsSliderParts, injectControlStatus, uniqueId } from 'pada-ds-angular/headless';
import {
  ColorFormat,
  formatColor,
  formatHex,
  MAX_CHROMA,
  Oklch,
  oklchToRgb,
  parseColor,
  toGamut,
} from './color';

/** A preset colour of a `ds-color-picker`. */
export interface ColorSwatch {
  value: string;
  /** Accessible name, e.g. "Brand indigo". Defaults to the value. */
  label?: string;
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const percent = (value: number) => `${Math.round(value * 100)}%`;
const FALLBACK: Oklch = { l: 0.5, c: 0.2, h: 277 };

/** Area resolution: painted small and scaled up by CSS, which smooths it. */
const AREA_WIDTH = 96;
const AREA_HEIGHT = 64;

function paintArea(canvas: HTMLCanvasElement, hue: number) {
  const context = canvas.getContext?.('2d');
  if (!context) return;
  const image = context.createImageData(AREA_WIDTH, AREA_HEIGHT);
  for (let y = 0; y < AREA_HEIGHT; y += 1) {
    for (let x = 0; x < AREA_WIDTH; x += 1) {
      const color = toGamut({
        l: 1 - y / (AREA_HEIGHT - 1),
        c: (x / (AREA_WIDTH - 1)) * MAX_CHROMA,
        h: hue,
      });
      const [r, g, b] = oklchToRgb(color);
      const offset = (y * AREA_WIDTH + x) * 4;
      image.data[offset] = clamp(r, 0, 1) * 255;
      image.data[offset + 1] = clamp(g, 0, 1) * 255;
      image.data[offset + 2] = clamp(b, 0, 1) * 255;
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
}

/**
 * Pick a colour in OKLCH, the perceptual colour space Pada's tokens use: an area for chroma
 * (left to right) and lightness (bottom to top), a hue slider, a hex field and optional
 * swatches. Colours outside sRGB are shown at their nearest displayable colour. Works with
 * Angular forms (a colour string) or through `[(value)]`.
 *
 * ```html
 * <ds-color-picker label="Accent colour" [(value)]="accent" [swatches]="['#ef4444', '#22c55e']" />
 * <ds-color-picker label="Brand" format="oklch" formControlName="brand" />
 * ```
 *
 * The area is a 2D slider (`aria-roledescription="2D slider"`): arrows change chroma and
 * lightness (Shift for ten times the step), PageUp/PageDown lightness by 10%, Home/End chroma.
 * The hex field commits on Enter or blur and reverts on Escape; it is `aria-invalid` while it
 * holds text that is not a colour. A value that echoes back what the picker emitted is not
 * parsed again, so hex rounding never nudges the thumb or the hue.
 */
@Component({
  selector: 'ds-color-picker',
  imports: [DsSliderParts],
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-label]': 'label()',
    '[attr.data-disabled]': 'flag(isDisabled())',
    '[style.--pada-color-picker-value]': 'hex()',
    '[style.--pada-color-picker-hue]': 'color().h',
    '(focusout)': 'handleFocusOut($event)',
  },
})
export class ColorPickerComponent implements ControlValueAccessor, OnInit {
  /** Accessible name of the picker, e.g. "Accent colour". */
  readonly label = input.required<string>();
  /** The colour: `#rrggbb` or `oklch(L C H)`. Two-way bindable. @default '#4f46e5' */
  readonly value = model('#4f46e5');
  /**
   * Output format. `hex` maps the colour into sRGB; `oklch` keeps exactly what was chosen,
   * which may be outside sRGB on wide-gamut screens. @default 'hex'
   */
  readonly format = input<ColorFormat>('hex');
  /** Preset colours shown under the controls. */
  readonly swatches = input<readonly (string | ColorSwatch)[]>([]);
  /** Disables the picker. */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly hexId = uniqueId('ds-color-picker-hex-');
  protected readonly flag = dataFlag;

  // The last value this picker emitted, so a value that echoes it back is not parsed again.
  private emitted: string | undefined;
  /** The colour being edited; follows `value` unless the value is our own echo. */
  protected readonly color = linkedSignal<string, Oklch>({
    source: this.value,
    computation: (value, previous) =>
      previous && value === this.emitted
        ? previous.value
        : (parseColor(value) ?? previous?.value ?? FALLBACK),
  });
  protected readonly hex = computed(() => formatHex(this.color()));
  protected readonly hue = computed(() => [Math.round(this.color().h)]);
  protected readonly hexDraft = signal<string | null>(null);
  protected readonly hexInvalid = computed(() => {
    const draft = this.hexDraft();
    return draft !== null && !parseColor(draft);
  });
  protected readonly readout = computed(() =>
    formatColor(toGamut(this.color()), 'oklch').replace(/^oklch\(|\)$/g, ''),
  );
  protected readonly lightness = computed(() => Math.round(this.color().l * 100));
  protected readonly thumbX = computed(() => (this.color().c / MAX_CHROMA) * 100);
  protected readonly thumbY = computed(() => (1 - this.color().l) * 100);
  protected readonly hueText = computed(() => `Hue ${this.hue()[0]}°`);
  protected readonly areaText = computed(
    () => `Lightness ${percent(this.color().l)}, chroma ${this.color().c.toFixed(3)}`,
  );
  protected readonly items = computed(() =>
    this.swatches().map((swatch) => {
      const item = typeof swatch === 'string' ? { value: swatch } : swatch;
      const parsed = parseColor(item.value);
      const hex = parsed ? formatHex(parsed) : null;
      return { ...item, parsed, hex, selected: hex === this.hex() };
    }),
  );

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly area = viewChild.required<ElementRef<HTMLElement>>('area');
  private dragging = false;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    afterRenderEffect(() => paintArea(this.canvas().nativeElement, this.color().h));
  }

  ngOnInit() {
    this.status.connect();
  }

  private setColor(next: Oklch) {
    const normalized = {
      l: clamp(next.l, 0, 1),
      c: clamp(next.c, 0, MAX_CHROMA),
      h: ((next.h % 360) + 360) % 360,
    };
    const output = formatColor(normalized, this.format());
    this.emitted = output;
    this.color.set(normalized);
    if (output !== this.value()) {
      this.value.set(output);
      this.onChange(output);
    }
  }

  private fromPointer(event: PointerEvent) {
    const box = this.area().nativeElement.getBoundingClientRect();
    const x = clamp((event.clientX - box.left) / (box.width || 1), 0, 1);
    const y = clamp((event.clientY - box.top) / (box.height || 1), 0, 1);
    this.setColor({ ...this.color(), c: x * MAX_CHROMA, l: 1 - y });
  }

  protected handlePointerDown(event: PointerEvent) {
    if (this.isDisabled() || event.button !== 0) return;
    const area = this.area().nativeElement;
    this.dragging = true;
    try {
      area.setPointerCapture?.(event.pointerId);
    } catch {
      // The pointer is already gone.
    }
    this.fromPointer(event);
    area.querySelector<HTMLElement>('[role="slider"]')?.focus({ preventScroll: true });
    event.preventDefault();
  }

  protected handlePointerMove(event: PointerEvent) {
    if (this.dragging) this.fromPointer(event);
  }

  protected handlePointerUp(event: PointerEvent) {
    this.dragging = false;
    try {
      this.area().nativeElement.releasePointerCapture?.(event.pointerId);
    } catch {
      // Already released.
    }
  }

  protected handleAreaKeydown(event: KeyboardEvent) {
    if (this.isDisabled()) return;
    const color = this.color();
    const large = event.shiftKey ? 10 : 1;
    const moves: Record<string, Partial<Oklch>> = {
      ArrowRight: { c: color.c + 0.005 * large },
      ArrowLeft: { c: color.c - 0.005 * large },
      ArrowUp: { l: color.l + 0.01 * large },
      ArrowDown: { l: color.l - 0.01 * large },
      PageUp: { l: color.l + 0.1 },
      PageDown: { l: color.l - 0.1 },
      Home: { c: 0 },
      End: { c: MAX_CHROMA },
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    this.setColor({ ...color, ...moves[event.key] });
  }

  protected setHue(values: number[]) {
    this.setColor({ ...this.color(), h: values[0] });
  }

  protected commitHex() {
    const draft = this.hexDraft();
    if (draft === null) return;
    const parsed = parseColor(draft);
    if (parsed) this.setColor(parsed);
    this.hexDraft.set(null);
  }

  protected handleHexKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') this.commitHex();
    if (event.key === 'Escape' && this.hexDraft() !== null) {
      event.stopPropagation();
      this.hexDraft.set(null);
    }
  }

  protected pickSwatch(parsed: Oklch | null) {
    if (parsed) this.setColor(parsed);
  }

  protected handleFocusOut(event: FocusEvent) {
    if (!this.element.contains(event.relatedTarget as Node | null)) this.onTouched();
  }

  writeValue(value: string | null): void {
    if (typeof value === 'string' && value) this.value.set(value);
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}
