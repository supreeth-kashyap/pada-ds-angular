import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  numberAttribute,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { injectControlStatus, uniqueId } from 'pada-ds-angular/headless';
import { IconComponent } from '../icon/icon';

export interface UploadedFile {
  id: string;
  file: File;
  /** Upload progress, 0 to 100. Below 100 it shows a progress bar. */
  progress?: number;
  status?: 'uploading' | 'success' | 'error';
  error?: string;
}

/** Passed to `view`. Call `preventDefault()` to stop the file opening in a new tab. */
export interface UploadViewEvent {
  file: UploadedFile;
  defaultPrevented: boolean;
  preventDefault(): void;
}

/** Formats a byte count: `1 KB`, `2.5 MB`. */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const optionalNumber = (value: unknown) =>
  value === undefined || value === null ? undefined : numberAttribute(value);

let fileCount = 0;
const generateFileId = () => `file-${Date.now()}-${(fileCount += 1)}`;

/** Opens a picked file in a new tab, for the default View action. */
const openFile = (file: File) => {
  const url = URL.createObjectURL(file);
  window.open(url, '_blank', 'noopener');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

/**
 * A file picker with a drop zone. The zone is a real file input underneath, so keyboard users
 * Tab to it and press Space or Enter to browse; dropped and picked files list below with their
 * size, upload progress (`role="progressbar"`), status, and View and Remove actions. The
 * description and the accept, size and count hints describe the input. Works with Angular forms
 * (the value is the `UploadedFile[]` list) or on its own through `[(files)]`.
 *
 * ```html
 * <ds-upload-field label="Evidence" accept=".pdf" [maxSize]="5_000_000" multiple
 *   [upload]="uploadFiles" [(files)]="evidence" (view)="preview($event)" />
 * ```
 *
 * Differences from React: `onUpload` is the `upload` input (a function returning a promise,
 * so the field can mark files successful or failed); `onView` is the `view` output, whose
 * event opens the file in a new tab unless you call `preventDefault()`.
 */
@Component({
  selector: 'ds-upload-field',
  imports: [IconComponent],
  templateUrl: './upload-field.html',
  styleUrl: './upload-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadFieldComponent implements ControlValueAccessor, OnInit {
  /** Visible label. Without it the input is named "Upload files". */
  readonly label = input<string>();
  /** Help text in the drop zone, hidden while the error shows. */
  readonly description = input<string>();
  /** Error message; marks the field invalid. */
  readonly error = input<string>();
  /** Accepted file types, as for `<input type="file">`. Listed as a hint. */
  readonly accept = input<string>();
  /** Pick several files; new picks add to the list instead of replacing it. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Maximum size per file, in bytes. Larger files are listed with an error. */
  readonly maxSize = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** Maximum number of files. A pick that would exceed it is ignored. */
  readonly maxFiles = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  /** Uploads the valid new files; resolve to mark them successful, reject to mark them failed. */
  readonly upload = input<(files: File[]) => Promise<void> | void>();
  /** Id of the file input. Generated when omitted. */
  readonly inputId = input(uniqueId('ds-upload-field-'));
  /** The listed files. Two-way bindable: `[(files)]`. */
  readonly files = model<UploadedFile[]>([]);
  /** A file's View button was pressed. Opens the file in a new tab unless prevented. */
  readonly view = output<UploadViewEvent>();

  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  protected readonly dragging = signal(false);

  private readonly status = injectControlStatus(this);
  private readonly formsDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formsDisabled());
  protected readonly isRequired = computed(() => this.required() || this.status.required());
  protected readonly hasError = computed(
    () => !!this.error() && (!this.status.ngControl || this.status.invalid()),
  );
  protected readonly descriptionId = computed(() => `${this.inputId()}-description`);
  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  protected readonly hintsId = computed(() => `${this.inputId()}-hints`);
  protected readonly describedBy = computed(() =>
    [
      this.hasError() && this.errorId(),
      this.description() && !this.hasError() && this.descriptionId(),
      this.hintsId(),
    ]
      .filter(Boolean)
      .join(' '),
  );
  protected readonly maxSizeText = computed(() => {
    const max = this.maxSize();
    return max ? formatFileSize(max) : null;
  });
  protected readonly rows = computed(() =>
    this.files().map((file) => ({
      file,
      size: formatFileSize(file.file.size),
      uploading: file.progress !== undefined && file.progress < 100,
      progress: Math.round(file.progress ?? 0),
    })),
  );

  private onChange: (files: UploadedFile[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // A click anywhere in the drop zone browses (the file list stops its own clicks).
    afterNextRender(() => {
      this.container().nativeElement.addEventListener('click', (event) => {
        const target = event.target as Element;
        if (target === this.fileInput().nativeElement || target.closest('.upload-field-files'))
          return;
        if (!this.isDisabled()) this.fileInput().nativeElement.click();
      });
    });
  }

  ngOnInit() {
    this.status.connect();
  }

  private setFiles(files: UploadedFile[]) {
    this.files.set(files);
    this.onChange(files);
  }

  private async handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const picked = Array.from(fileList);
    const current = this.files();
    const maxFiles = this.maxFiles();
    if (maxFiles && current.length + picked.length > maxFiles) return;

    const maxSize = this.maxSize();
    const added: UploadedFile[] = picked.map((file) => {
      const error =
        maxSize && file.size > maxSize ? `File size exceeds ${formatFileSize(maxSize)}` : undefined;
      return { id: generateFileId(), file, status: error ? 'error' : undefined, error };
    });
    const updated = this.multiple() ? [...current, ...added] : added;
    this.setFiles(updated);

    const upload = this.upload();
    const valid = added.filter((file) => !file.error);
    if (!upload || valid.length === 0) return;
    const ids = new Set(valid.map((file) => file.id));
    try {
      await upload(valid.map((file) => file.file));
      this.setFiles(
        this.files().map((file) =>
          ids.has(file.id) ? { ...file, status: 'success' as const } : file,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      this.setFiles(
        this.files().map((file) =>
          ids.has(file.id) ? { ...file, status: 'error' as const, error: message } : file,
        ),
      );
    }
  }

  protected onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    void this.handleFiles(input.files);
    // Reset so the same file can be picked again.
    input.value = '';
    this.onTouched();
  }

  protected onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isDisabled()) this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(false);
    if (!this.isDisabled()) void this.handleFiles(event.dataTransfer?.files ?? null);
  }

  protected remove(event: Event, id: string) {
    event.stopPropagation();
    this.setFiles(this.files().filter((file) => file.id !== id));
  }

  protected viewFile(event: Event, file: UploadedFile) {
    event.stopPropagation();
    const viewEvent: UploadViewEvent = {
      file,
      defaultPrevented: false,
      preventDefault() {
        viewEvent.defaultPrevented = true;
      },
    };
    this.view.emit(viewEvent);
    if (!viewEvent.defaultPrevented) openFile(file.file);
  }

  writeValue(files: UploadedFile[] | null): void {
    this.files.set(Array.isArray(files) ? files : []);
  }
  registerOnChange(fn: (files: UploadedFile[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formsDisabled.set(disabled);
  }
}
