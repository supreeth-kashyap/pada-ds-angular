import { inject, Injectable, signal } from '@angular/core';

export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

/** One action button on a toast, e.g. Undo. */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Reuse an id to update a toast in place instead of adding another. */
  id?: string;
  title?: string;
  description?: string;
  /** Colour and icon; `danger` toasts are announced assertively. @default 'neutral' */
  tone?: ToastTone;
  /** Milliseconds before it closes on its own. `Infinity` keeps it until dismissed. @default 5000 */
  duration?: number;
  /** One action button, e.g. Undo. Clicking it also closes the toast. */
  action?: ToastAction;
  /** Called after the toast closes, for any reason. */
  onDismiss?: () => void;
}

/** A toast as the Toaster renders it. */
export interface ToastRecord extends Omit<ToastOptions, 'id' | 'tone' | 'duration'> {
  id: string;
  tone: ToastTone;
  duration: number;
  /** False once dismissed: the Toaster plays the exit animation, then removes it. */
  open: boolean;
  createdAt: number;
}

/** A title, or the full options. */
export type ToastInput = string | ToastOptions;

/**
 * The toast queue for the app: the Angular equivalent of React's `toast()` store. Render one
 * `<ds-toaster />` near the root of the app to show the toasts. `injectToast()` gives the same
 * API as a callable, like React's `toast`.
 *
 * ```ts
 * private readonly toasts = inject(ToastService);
 * save() {
 *   const id = this.toasts.show({ title: 'Uploading…', duration: Infinity });
 *   upload().then(() => this.toasts.success({ id, title: 'Uploaded' }));
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly records = signal<ToastRecord[]>([]);
  private counter = 0;

  /** Every toast, oldest first, including closed ones still animating out. */
  readonly toasts = this.records.asReadonly();

  /** Shows a toast (or replaces the one with the same `id`) and returns its id. */
  show(input: ToastInput, defaults: Partial<ToastOptions> = {}): string {
    const options = typeof input === 'string' ? { title: input } : input;
    const merged = { ...defaults, ...options };
    const id = merged.id ?? `toast-${++this.counter}`;
    const record: ToastRecord = {
      tone: 'neutral',
      duration: 5000,
      ...merged,
      id,
      open: true,
      createdAt: Date.now(),
    };
    this.records.update((records) => {
      const index = records.findIndex((item) => item.id === id);
      return index === -1
        ? [...records, record]
        : records.map((item, i) => (i === index ? record : item));
    });
    return id;
  }

  /** Shows a success toast. */
  success(input: ToastInput) {
    return this.show(input, { tone: 'success' });
  }

  /** Shows a warning toast. */
  warning(input: ToastInput) {
    return this.show(input, { tone: 'warning' });
  }

  /** Shows a danger toast, announced assertively. */
  danger(input: ToastInput) {
    return this.show(input, { tone: 'danger' });
  }

  /** Shows an info toast. */
  info(input: ToastInput) {
    return this.show(input, { tone: 'info' });
  }

  /** Changes an open toast in place, keeping what is not given. Its timer starts over. */
  update(id: string, changes: Omit<ToastOptions, 'id'>) {
    const current = this.records().find((item) => item.id === id && item.open);
    if (current) this.show({ ...current, ...changes, id });
  }

  /** Closes one toast, or all of them when called without an id. */
  dismiss(id?: string) {
    this.records.update((records) =>
      records.map((item) => {
        if ((id !== undefined && item.id !== id) || !item.open) return item;
        item.onDismiss?.();
        return { ...item, open: false };
      }),
    );
  }

  /** Removes a closed toast once its exit animation has finished. The Toaster calls this. */
  remove(id: string) {
    this.records.update((records) => records.filter((item) => item.id !== id));
  }
}

/** `toast()` and its helpers, as returned by `injectToast()`. */
export type ToastFn = ((input: ToastInput) => string) & {
  success: (input: ToastInput) => string;
  warning: (input: ToastInput) => string;
  danger: (input: ToastInput) => string;
  info: (input: ToastInput) => string;
  update: (id: string, changes: Omit<ToastOptions, 'id'>) => void;
  dismiss: (id?: string) => void;
};

/**
 * React's `toast` as a callable, for an injection context (a field initializer).
 *
 * ```ts
 * private readonly toast = injectToast();
 * archive() {
 *   this.toast.success({ title: 'Archived', action: { label: 'Undo', onClick: () => this.undo() } });
 * }
 * ```
 */
export function injectToast(): ToastFn {
  const service = inject(ToastService);
  return Object.assign((input: ToastInput) => service.show(input), {
    success: (input: ToastInput) => service.success(input),
    warning: (input: ToastInput) => service.warning(input),
    danger: (input: ToastInput) => service.danger(input),
    info: (input: ToastInput) => service.info(input),
    update: (id: string, changes: Omit<ToastOptions, 'id'>) => service.update(id, changes),
    dismiss: (id?: string) => service.dismiss(id),
  });
}
