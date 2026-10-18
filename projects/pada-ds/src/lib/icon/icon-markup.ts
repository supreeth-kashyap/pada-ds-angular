type IconRegistry = Readonly<Record<string, string>>;

// The built-in SVGs are a separate chunk, loaded on first use, so they stay out of an app's
// initial bundle.
let registry: IconRegistry | null = null;
let loading: Promise<IconRegistry> | null = null;

/** The built-in icons once loaded (synchronously), or null before. */
export const loadedIcons = (): IconRegistry | null => registry;

/** Loads the built-in icons (once) and resolves to name → SVG markup. */
export function loadIcons(): Promise<IconRegistry> {
  loading ??= import('./icons.generated').then((module) => (registry = module.BUILT_IN_ICONS));
  return loading;
}

/** Names of every built-in icon, sorted alphabetically. Pass any of these as `ds-icon`'s `name`. */
export const loadIconNames = async (): Promise<string[]> => Object.keys(await loadIcons()).sort();

/** Raw SVG markup for a built-in icon, or `undefined` if `name` isn't bundled. */
export const getBuiltInIcon = async (name: string): Promise<string | undefined> => {
  const icons = await loadIcons();
  return Object.prototype.hasOwnProperty.call(icons, name) ? icons[name] : undefined;
};

export const isBuiltInIcon = (icons: IconRegistry, name: string) =>
  Object.prototype.hasOwnProperty.call(icons, name);

// An explicit `fill="…"` / `stroke="…"` whose value is a paint we should replace:
// anything except `none` and `url(#…)` references (gradients / patterns).
const PAINT_ATTR = /(\s)(fill|stroke)="(?!\s*none\s*")(?!\s*url\()[^"]*"/gi;
const DEFS_BLOCK = /(<defs\b[\s\S]*?<\/defs>)/i;
const ROOT_TAG = /^(\s*(?:<\?xml[^>]*>\s*)?)<svg\b([^>]*)>/i;

/**
 * Makes an SVG adopt the surrounding text colour and scale to the icon box:
 * explicit, non-`none` fills and strokes become `currentColor` (shapes inside `<defs>` are left
 * alone), a root without a fill gets `fill="currentColor"`, and the root's fixed size becomes
 * 100% so `viewBox` drives scaling. String-based, so server and client produce the same markup.
 */
export function recolorSvg(markup: string): string {
  const rootMatch = ROOT_TAG.exec(markup);
  if (!rootMatch) return markup;
  const [rootTag, prolog, rootAttrs] = rootMatch;
  let attrs = rootAttrs.replace(/\s(width|height)="[^"]*"/gi, '');
  attrs = attrs.replace(PAINT_ATTR, '$1$2="currentColor"');
  if (!/\sfill="/i.test(attrs)) attrs += ' fill="currentColor"';
  const body = markup
    .slice(rootTag.length)
    .split(DEFS_BLOCK)
    .map((part) => (DEFS_BLOCK.test(part) ? part : part.replace(PAINT_ATTR, '$1$2="currentColor"')))
    .join('');
  return `${prolog}<svg width="100%" height="100%"${attrs}>${body}`;
}

/**
 * Material Symbols, the fallback for names that are not built in: static SVGs (weight 400,
 * outlined) from a pinned npm version, so a new release cannot change or remove a glyph.
 */
const MATERIAL_SYMBOLS_CDN =
  'https://cdn.jsdelivr.net/npm/@material-symbols/svg-400@0.27.0/outlined';

export const materialSymbolUrl = (name: string, variant: 'stroke' | 'fill') =>
  `${MATERIAL_SYMBOLS_CDN}/${name}${variant === 'fill' ? '-fill' : ''}.svg`;

export const isSvgMarkup = (input: string) => input.trim().startsWith('<svg');

/** Fetches an SVG. Resolves to its markup, or null when it is missing or not an SVG. */
export async function loadSvg(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();
    return /<svg\b/i.test(text) ? text : null;
  } catch {
    return null;
  }
}
