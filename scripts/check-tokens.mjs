// Token checks for the library styles. Fails when:
//
// 1. A synced token file (tokens.css, _tokens.scss) was edited by hand. Their header holds a
//    hash of the body written by `npm run tokens:sync` in the React repo (pada-ds).
// 2. Component styles read a custom property that nothing defines. Undefined tokens fall back
//    silently in the browser, so they only show up as subtle visual bugs.
// 3. Component styles use a raw colour (#hex, rgb(), hsl(), oklch()) or a tier-0 palette token
//    (--pada-ref-*, --pada-palette-*) instead of a semantic or component token.
//
// A property counts as defined when it is declared in tokens.css, declared in any library
// stylesheet (component tokens such as --pada-dialog-width), or set from TS as a host style
// binding ('[style.--x]') or with style.setProperty('--x', …).
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const libDir = path.join(rootDir, 'projects/pada-ds');
const stylesDir = path.join(libDir, 'src/styles');
const SYNCED = ['tokens.css', '_tokens.scss'];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    }),
  );
  return files.flat();
}

const HEADER = /^(?:\/\*|\/\/) pada-tokens v[\w.-]+ sha256:([0-9a-f]{64}) [^\n]*\n/;
const DECLARATION = /(--[\w-]+)\s*:/g;
const TS_STYLE = /(?:style\.(--[\w-]+)|setProperty\(\s*['"](--[\w-]+)['"]|['"](--[\w-]+)['"]\s*:)/g;
const REFERENCE = /var\(\s*(--[\w-]+)/g;
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/;
const TIER_0 = /--pada-(?:ref|palette)-/;

export async function checkSyncedFiles() {
  const problems = [];
  for (const file of SYNCED) {
    const text = await readFile(path.join(stylesDir, file), 'utf8').catch(() => null);
    if (text === null) {
      problems.push(
        `${file}: missing. Run \`npm run tokens:sync -- ../pada-ds-angular\` in pada-ds.`,
      );
      continue;
    }
    const match = text.match(HEADER);
    const body = match ? text.slice(match[0].length) : text;
    const hash = createHash('sha256').update(body).digest('hex');
    if (!match)
      problems.push(`${file}: no pada-tokens header; the file must come from tokens:sync.`);
    else if (match[1] !== hash)
      problems.push(`${file}: edited by hand (hash mismatch). Re-sync it from pada-ds.`);
  }
  return problems;
}

export async function checkStyles() {
  // .storybook holds Storybook's own docs chrome, not library styles.
  const files = (await walk(libDir)).filter((file) => !file.split(path.sep).includes('.storybook'));
  const styleFiles = files.filter(
    (file) => /\.(s?css)$/.test(file) && !SYNCED.includes(path.basename(file)),
  );
  const tsFiles = files.filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'));

  const defined = new Set();
  const add = (text, pattern) => {
    for (const match of text.matchAll(pattern)) defined.add(match[1] ?? match[2] ?? match[3]);
  };
  add(await readFile(path.join(stylesDir, 'tokens.css'), 'utf8').catch(() => ''), DECLARATION);
  const styleTexts = await Promise.all(styleFiles.map((file) => readFile(file, 'utf8')));
  styleTexts.forEach((text) => add(text, DECLARATION));
  for (const file of tsFiles) add(await readFile(file, 'utf8'), TS_STYLE);

  const problems = [];
  styleFiles.forEach((file, index) => {
    const relative = path.relative(rootDir, file);
    styleTexts[index].split('\n').forEach((line, lineIndex) => {
      const code = line.replace(/\/\/.*$|\/\*.*?\*\//g, '');
      const where = `${relative}:${lineIndex + 1}`;
      for (const match of code.matchAll(REFERENCE)) {
        if (!defined.has(match[1])) problems.push(`${where} undefined ${match[1]}`);
      }
      if (RAW_COLOR.test(code)) problems.push(`${where} raw colour: use a semantic token`);
      if (TIER_0.test(code)) problems.push(`${where} palette token: use a semantic token`);
    });
  });
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = [...(await checkSyncedFiles()), ...(await checkStyles())];
  if (problems.length) {
    console.error(`Token check failed:\n${problems.join('\n')}`);
    process.exit(1);
  }
  console.log('Synced token files are intact and every style reads a defined, semantic token.');
}
