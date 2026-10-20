// A small syntax highlighter for the languages CodeSnippet supports (bash, JavaScript,
// TypeScript, JSON, YAML, Python). It produces typed tokens rather than HTML, so the template
// renders them as text and nothing is ever injected as markup.

export type CodeTokenType =
  | 'plain'
  | 'comment'
  | 'keyword'
  | 'boolean'
  | 'string'
  | 'number'
  | 'variable'
  | 'property'
  | 'operator'
  | 'punctuation';

export interface CodeToken {
  type: CodeTokenType;
  text: string;
}

type Language = 'bash' | 'javascript' | 'typescript' | 'json' | 'yaml' | 'python';

const ALIASES: Record<string, Language> = {
  sh: 'bash',
  shell: 'bash',
  bash: 'bash',
  js: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  py: 'python',
  python: 'python',
};

const JS_KEYWORDS =
  'as async await break case catch class const continue debugger default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while with yield';
const TS_KEYWORDS = `${JS_KEYWORDS} abstract declare enum implements interface keyof namespace private protected public readonly satisfies type`;
const KEYWORDS: Record<Language, Set<string>> = {
  javascript: new Set(JS_KEYWORDS.split(' ')),
  typescript: new Set(TS_KEYWORDS.split(' ')),
  python: new Set(
    'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(
      ' ',
    ),
  ),
  bash: new Set(
    'case do done elif else esac export fi for function if in local return then until while'.split(
      ' ',
    ),
  ),
  json: new Set(),
  yaml: new Set(),
};
const BOOLEANS = new Set(['true', 'false', 'null', 'undefined', 'True', 'False', 'None']);

interface Rule {
  type: CodeTokenType | 'word';
  pattern: RegExp;
}

const STRING = /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'/y;
const NUMBER = /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/iy;
const WORD = /[A-Za-z_$][\w$]*/y;
const OPERATOR = /[=+\-*/%<>!&|?^~]+/y;
const PUNCTUATION = /[{}()[\];,.:@]/y;

const RULES: Record<Language, Rule[]> = {
  javascript: [
    { type: 'comment', pattern: /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y },
    { type: 'string', pattern: /`(?:\\[\s\S]|[^`\\])*`/y },
    { type: 'string', pattern: STRING },
    { type: 'number', pattern: NUMBER },
    { type: 'word', pattern: WORD },
    { type: 'operator', pattern: OPERATOR },
    { type: 'punctuation', pattern: PUNCTUATION },
  ],
  typescript: [],
  json: [
    { type: 'property', pattern: /"(?:\\[\s\S]|[^"\\])*"(?=\s*:)/y },
    { type: 'string', pattern: STRING },
    { type: 'number', pattern: NUMBER },
    { type: 'word', pattern: WORD },
    { type: 'punctuation', pattern: PUNCTUATION },
  ],
  yaml: [
    { type: 'comment', pattern: /#[^\n]*/y },
    { type: 'property', pattern: /[\w.-]+(?=\s*:(?:\s|$))/y },
    { type: 'string', pattern: STRING },
    { type: 'number', pattern: NUMBER },
    { type: 'word', pattern: WORD },
    { type: 'punctuation', pattern: /[-:[\]{},|>]/y },
  ],
  python: [
    { type: 'comment', pattern: /#[^\n]*/y },
    { type: 'string', pattern: /"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)/y },
    { type: 'string', pattern: STRING },
    { type: 'number', pattern: NUMBER },
    { type: 'word', pattern: WORD },
    { type: 'operator', pattern: OPERATOR },
    { type: 'punctuation', pattern: PUNCTUATION },
  ],
  bash: [
    { type: 'comment', pattern: /(?<![^\s])#[^\n]*/y },
    { type: 'variable', pattern: /\$(?:\{[^}]*\}|[A-Za-z_]\w*|\d)/y },
    { type: 'string', pattern: STRING },
    { type: 'number', pattern: NUMBER },
    { type: 'word', pattern: /[A-Za-z_][\w-]*/y },
    { type: 'operator', pattern: /[|&;<>=]+/y },
  ],
};
RULES.typescript = RULES.javascript;

/** The language name CodeSnippet highlights, or `null` when it is not supported. */
export function normalizeLanguage(language: string): Language | null {
  return ALIASES[language.toLowerCase()] ?? null;
}

/** Splits `code` into highlighted tokens. Unsupported languages come back as one plain token. */
export function highlightCode(code: string, language: string): CodeToken[] {
  const lang = normalizeLanguage(language);
  if (!lang) return [{ type: 'plain', text: code }];
  const rules = RULES[lang];
  const tokens: CodeToken[] = [];
  const push = (type: CodeTokenType, text: string) => {
    const last = tokens[tokens.length - 1];
    if (last && last.type === type && type === 'plain') last.text += text;
    else tokens.push({ type, text });
  };
  let index = 0;
  outer: while (index < code.length) {
    for (const rule of rules) {
      rule.pattern.lastIndex = index;
      const match = rule.pattern.exec(code);
      if (!match || match[0] === '') continue;
      const text = match[0];
      if (rule.type === 'word') {
        push(BOOLEANS.has(text) ? 'boolean' : KEYWORDS[lang].has(text) ? 'keyword' : 'plain', text);
      } else {
        push(rule.type, text);
      }
      index += text.length;
      continue outer;
    }
    push('plain', code[index]);
    index += 1;
  }
  return tokens;
}
