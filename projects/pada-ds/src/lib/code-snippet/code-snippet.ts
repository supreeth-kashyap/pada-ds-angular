import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ButtonComponent } from '../button/button';
import { highlightCode } from './highlight';

export type CodeSnippetType = 'micro' | 'single-line' | 'multi-line';

/**
 * A block of code on a dark surface, with a label, syntax highlighting and a copy button.
 *
 * ```html
 * <ds-code-snippet language="bash" code="npm install pada-ds-angular" type="single-line" />
 * ```
 *
 * Highlights bash, JavaScript, TypeScript, JSON, YAML and Python (and their short names `sh`,
 * `js`, `ts`, `yml`, `py`); other languages show as plain text.
 *
 * Differences from React: highlighting is a small built-in tokenizer rendered as text (React
 * uses Prism and `innerHTML`), so token classes cover comments, keywords, booleans, strings,
 * numbers, variables, properties, operators and punctuation. The code block is a focusable,
 * named region so keyboard users can scroll it.
 */
@Component({
  selector: 'ds-code-snippet',
  imports: [ButtonComponent],
  template: `
    <div class="code-snippet-header">
      <span class="code-snippet-label">{{ displayLabel() }}</span>
      @if (showCopy()) {
        <button dsButton variant="secondary" leftIcon="copy" (click)="copyCode()">
          {{ justCopied() ? 'Copied' : 'Copy' }}
        </button>
      }
    </div>
    <pre
      class="code-snippet-body"
      role="region"
      tabindex="0"
      [attr.aria-label]="language() + ' code'"
    ><code class="code-snippet-code">@for (token of tokens(); track $index) {@if (token.type === 'plain') {{{ token.text }}} @else {<span class="token" [attr.data-token]="token.type">{{ token.text }}</span>}}</code></pre>
  `,
  styleUrl: './code-snippet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-type]': 'type()' },
})
export class CodeSnippetComponent {
  /** The code to show and copy. */
  readonly code = input.required<string>();
  /** Language for highlighting and the default label, e.g. `ts`, `bash`, `json`. */
  readonly language = input.required<string>();
  /** `micro` (tight padding), `single-line` (no wrapping) or `multi-line`. @default 'multi-line' */
  readonly type = input<CodeSnippetType>('multi-line');
  /** Header text. @default '<language> code' */
  readonly label = input<string>();
  /** Shows the copy button. @default true */
  readonly showCopy = input(true, { transform: booleanAttribute });
  /** The code was copied to the clipboard. */
  readonly copied = output<string>();

  private readonly document = inject(DOCUMENT);
  private resetTimer: ReturnType<typeof setTimeout> | undefined;
  protected readonly justCopied = signal(false);
  protected readonly tokens = computed(() => highlightCode(this.code(), this.language()));
  protected readonly displayLabel = computed(() => this.label() ?? `${this.language()} code`);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.resetTimer));
  }

  protected async copyCode() {
    const code = this.code();
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // No Clipboard API (or no permission): copy through a hidden textarea.
      const textarea = this.document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      this.document.body.appendChild(textarea);
      textarea.select();
      this.document.execCommand?.('copy');
      textarea.remove();
    }
    this.justCopied.set(true);
    this.copied.emit(code);
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => this.justCopied.set(false), 1200);
  }
}
