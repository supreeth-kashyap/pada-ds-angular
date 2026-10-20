import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import {
  DsField,
  DsFieldControl,
  DsFieldDescription,
  DsFieldError,
  DsFieldLabel,
  DsVisuallyHidden,
  injectControlStatus,
  uniqueId,
} from 'pada-ds-angular/headless';

const countTags = (count: number) => `${count} ${count === 1 ? 'tag' : 'tags'}`;

/**
 * Free-form tags (emails, keywords, labels) typed into one field. Enter or a comma adds the
 * text as a tag; pasting a comma-, semicolon- or line-separated list adds them all. Backspace
 * (or ArrowLeft) at the start of the field moves to the tags, where Backspace or Delete removes
 * one and ArrowLeft/ArrowRight move between them. Additions and removals are announced. Works
 * with Angular forms (a `string[]`) or on its own through `[(value)]`. For picking from known
 * options, use `ds-autocomplete` with `multiple`.
 *
 * ```html
 * <ds-tag-input label="Keywords" name="keywords" [maxTags]="5" formControlName="keywords" />
 * <ds-tag-input label="Emails" [validate]="isEmail" [(value)]="emails" />
 * ```
 *
 * Difference from React: with a forms control, `error` shows only once the control is invalid
 * and touched; the field's own messages (duplicates, `validate`, `maxTags`) always show.
 */
@Component({
  selector: 'ds-tag-input',
  imports: [
    DsField,
    DsFieldLabel,
    DsFieldControl,
    DsFieldDescription,
    DsFieldError,
    DsVisuallyHidden,
  ],
  templateUrl: './tag-input.html',
  styleUrl: './tag-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagInputComponent implements ControlValueAccessor, OnInit {
  /** Visible label. */
  readonly label = input.required<string>();
  /** The tags. Two-way bindable: `[(value)]`. */
  readonly value = model<string[]>([]);
  readonly placeholder = input<string>();
  /** Help text under the field. */
  readonly description = input<string>();
  /** Error message; marks the field invalid. */
  readonly error = input<string>();
  /** Keys that turn the typed text into a tag. @default ['Enter', ','] */
  readonly separators = input<readonly string[]>(['Enter', ',']);
  /** Maximum number of tags. */
  readonly maxTags = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /** Allow the same tag twice (case-insensitive). @default false */
  readonly allowDuplicates = input(false, { transform: booleanAttribute });
  /** Return an error message to reject a tag. */
  readonly validate = input<(tag: string) => string | null | undefined>();
  /** Turn left-over text into a tag when the field loses focus. @default true */
  readonly addOnBlur = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  /** Submits each tag with native forms under this name (hidden inputs). */
  readonly name = input<string>();
  /** Id of the input. Generated when omitted. */
  readonly inputId = input(uniqueId('ds-tag-input-'));

  private readonly injector = inject(Injector);
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');

  protected readonly text = signal('');
  private readonly inputError = signal<string | null>(null);
  protected readonly announcement = signal('');

  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly isRequired = computed(() => this.required() || this.status.required());
  private readonly externalError = computed(() => {
    const error = this.error();
    if (!error) return null;
    return !this.status.ngControl || this.status.invalid() ? error : null;
  });
  protected readonly shownError = computed(() => this.externalError() ?? this.inputError());
  protected readonly full = computed(() => {
    const max = this.maxTags();
    return max !== undefined && this.value().length >= max;
  });
  protected readonly listLabel = computed(
    () => `${this.label()}: ${countTags(this.value().length)}`,
  );

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // A click on the box itself (not a tag) focuses the input.
    afterNextRender(() => {
      const box = this.box().nativeElement;
      box.addEventListener('click', (event) => {
        if (event.target === box) this.inputRef().nativeElement.focus();
      });
    });
  }

  ngOnInit() {
    this.status.connect();
  }

  private setTags(tags: string[]) {
    this.value.set(tags);
    this.onChange(tags);
  }

  private removeButtons() {
    return Array.from(this.list()?.nativeElement.querySelectorAll('button') ?? []);
  }

  /** Adds every valid candidate; keeps the rest (and the first error) in the field. */
  private add(candidates: string[]) {
    const tags = this.value();
    const next = [...tags];
    const rejected: string[] = [];
    let firstError: string | null = null;
    const max = this.maxTags();
    for (const raw of candidates) {
      const tag = raw.trim();
      if (!tag) continue;
      const problem =
        (max !== undefined && next.length >= max && `Up to ${max} tags.`) ||
        (!this.allowDuplicates() &&
          next.some((existing) => existing.toLowerCase() === tag.toLowerCase()) &&
          `"${tag}" is already added.`) ||
        this.validate()?.(tag) ||
        null;
      if (problem) {
        firstError ??= problem;
        rejected.push(tag);
      } else {
        next.push(tag);
      }
    }
    const added = next.slice(tags.length);
    if (added.length) {
      this.setTags(next);
      this.announcement.set(`Added ${added.join(', ')}. ${countTags(next.length)}.`);
    }
    this.inputError.set(firstError);
    this.text.set(rejected.join(', '));
  }

  protected remove(index: number, focusAfter: 'neighbour' | 'input' = 'neighbour') {
    const tags = this.value();
    const tag = tags[index];
    const next = tags.filter((_, position) => position !== index);
    this.setTags(next);
    this.inputError.set(null);
    this.announcement.set(`Removed ${tag}. ${countTags(next.length)}.`);
    // After the list re-renders, keep focus nearby.
    afterNextRender(
      () => {
        const buttons = this.removeButtons();
        if (focusAfter === 'input' || buttons.length === 0) this.inputRef().nativeElement.focus();
        else buttons[Math.min(index, buttons.length - 1)]?.focus();
      },
      { injector: this.injector },
    );
  }

  protected onInput(event: Event) {
    this.inputError.set(null);
    this.text.set((event.target as HTMLInputElement).value);
  }

  protected onInputKeyDown(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    if (this.separators().includes(event.key) && !event.isComposing) {
      if (!this.text().trim()) return;
      event.preventDefault();
      this.add([this.text()]);
    } else if (
      (event.key === 'Backspace' || event.key === 'ArrowLeft') &&
      input.selectionStart === 0 &&
      input.selectionEnd === 0 &&
      this.value().length
    ) {
      event.preventDefault();
      this.removeButtons().at(-1)?.focus();
    }
  }

  protected onTagKeyDown(event: KeyboardEvent, index: number) {
    const buttons = this.removeButtons();
    if (event.key === 'ArrowLeft') buttons[Math.max(0, index - 1)]?.focus();
    else if (event.key === 'ArrowRight')
      (buttons[index + 1] ?? this.inputRef().nativeElement).focus();
    else if (event.key === 'Backspace' || event.key === 'Delete') this.remove(index);
    else return;
    event.preventDefault();
  }

  protected onPaste(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (!/[,\n;]/.test(pasted)) return;
    event.preventDefault();
    this.add([this.text(), ...pasted.split(/[,\n;]/)]);
  }

  protected onBlur() {
    if (this.addOnBlur() && this.text().trim()) this.add([this.text()]);
    this.onTouched();
  }

  writeValue(value: string[] | null): void {
    this.value.set(Array.isArray(value) ? value : []);
  }
  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}
