import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { CodeSnippetComponent } from './code-snippet';
import { highlightCode } from './highlight';

describe('CodeSnippetComponent', () => {
  it('labels the snippet and renders the code as highlighted text', async () => {
    const code = 'const answer = 42; // the answer';
    const { container } = await render(`<ds-code-snippet language="ts" [code]="code" />`, {
      imports: [CodeSnippetComponent],
      componentProperties: { code },
    });
    expect(container.querySelector('.code-snippet-label')).toHaveTextContent('ts code');
    const region = screen.getByRole('region', { name: 'ts code' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region.textContent).toBe(code);
    expect(region.querySelector('[data-token="keyword"]')).toHaveTextContent('const');
    expect(region.querySelector('[data-token="number"]')).toHaveTextContent('42');
    expect(region.querySelector('[data-token="comment"]')).toHaveTextContent('// the answer');
    expect(container.querySelector('ds-code-snippet')).toHaveAttribute('data-type', 'multi-line');
    await expectNoA11yViolations(container);
  });

  it('copies the code and confirms it', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const onCopy = vi.fn();
    const { fixture } = await render(
      `<ds-code-snippet language="bash" code="npm i pada-ds-angular" label="Install" (copied)="onCopy($event)" />`,
      { imports: [CodeSnippetComponent], componentProperties: { onCopy } },
    );
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    await settle(fixture);
    expect(writeText).toHaveBeenCalledWith('npm i pada-ds-angular');
    expect(onCopy).toHaveBeenCalledWith('npm i pada-ds-angular');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    writeText.mockRestore();
  });

  it('hides the copy button on request', async () => {
    await render(`<ds-code-snippet language="json" code="{}" type="micro" [showCopy]="false" />`, {
      imports: [CodeSnippetComponent],
    });
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('highlightCode', () => {
  it('keeps the text intact and types the tokens', () => {
    const tokens = highlightCode('{"name": "pada", "ok": true, "n": 2}', 'json');
    expect(tokens.map((token) => token.text).join('')).toBe('{"name": "pada", "ok": true, "n": 2}');
    expect(tokens.find((token) => token.type === 'property')?.text).toBe('"name"');
    expect(tokens.find((token) => token.type === 'string')?.text).toBe('"pada"');
    expect(tokens.find((token) => token.type === 'boolean')?.text).toBe('true');
  });

  it('highlights bash variables and comments, python keywords and yaml keys', () => {
    expect(highlightCode('echo $HOME # home', 'sh')).toEqual(
      expect.arrayContaining([
        { type: 'variable', text: '$HOME' },
        { type: 'comment', text: '# home' },
      ]),
    );
    expect(highlightCode('def run(): return None', 'py')).toEqual(
      expect.arrayContaining([
        { type: 'keyword', text: 'def' },
        { type: 'boolean', text: 'None' },
      ]),
    );
    expect(highlightCode('name: pada', 'yml')[0]).toEqual({ type: 'property', text: 'name' });
  });

  it('leaves unknown languages as plain text', () => {
    expect(highlightCode('<b>hi</b>', 'html')).toEqual([{ type: 'plain', text: '<b>hi</b>' }]);
  });
});
