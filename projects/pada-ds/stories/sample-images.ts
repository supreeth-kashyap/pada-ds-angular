/**
 * Inline images for the stories, so they render without network requests: a portrait-style
 * placeholder, a landscape picture and a brand mark.
 */
const svg = (markup: string) => `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`;

export const portrait = (hue: number) =>
  svg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(${hue} 60% 78%)"/><circle cx="32" cy="25" r="12" fill="hsl(${hue} 45% 45%)"/><path d="M10 64c2-14 11-22 22-22s20 8 22 22z" fill="hsl(${hue} 45% 45%)"/></svg>`,
  );

export const landscape = (hue: number, label: string) =>
  svg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="hsl(${hue} 55% 82%)"/><path d="M0 280l160-120 120 90 110-70 250 170H0z" fill="hsl(${hue} 40% 52%)"/><circle cx="500" cy="90" r="40" fill="hsl(${(hue + 40) % 360} 80% 70%)"/><text x="32" y="64" font-family="sans-serif" font-size="36" fill="hsl(${hue} 40% 25%)">${label}</text></svg>`,
  );

export const brandMark = (hue: number, letter: string) =>
  svg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="hsl(${hue} 70% 45%)"/><text x="16" y="22" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="17" fill="white">${letter}</text></svg>`,
  );
