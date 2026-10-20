import type { Decorator, Preview } from '@storybook/angular';
import { PadaDocsPage } from './pada-docs/blocks';

const ACCENTS = [
  'indigo', 'blue', 'sky', 'cyan', 'teal', 'emerald', 'green', 'lime', 'yellow', 'amber',
  'orange', 'red', 'rose', 'pink', 'fuchsia', 'purple', 'violet', 'slate', 'gray', 'zinc', 'neutral', 'stone',
];

const AXES = ['theme', 'accent', 'neutral', 'density', 'radius', 'contrast'] as const;

// The toolbar's theme axes become data-* attributes on <html>, as the React Storybook's
// ThemeProvider does, so every story can be checked in each theme without per-story variants.
const withPadaTheme: Decorator = (story, context) => {
  const root = document.documentElement;
  for (const axis of AXES) {
    const value = context.globals[axis] as string | undefined;
    const name = `data-${axis}`;
    if (!value || (axis === 'theme' && value === 'system')) root.removeAttribute(name);
    else root.setAttribute(name, value);
  }
  return story();
};

const toolbar = <Icon extends string>(title: string, icon: Icon, items: string[]) => ({
  description: title,
  toolbar: { title, icon, items, dynamicTitle: true },
});

const preview: Preview = {
  decorators: [withPadaTheme],
  globalTypes: {
    theme: toolbar('Theme', 'mirror', ['light', 'dark', 'system']),
    accent: toolbar('Accent', 'paintbrush', ACCENTS),
    neutral: toolbar('Neutral', 'contrast', ['stone', 'slate', 'gray', 'zinc', 'neutral']),
    density: toolbar('Density', 'component', ['compact', 'comfortable', 'spacious']),
    radius: toolbar('Radius', 'circlehollow', ['none', 'sm', 'md', 'lg', 'xl']),
    contrast: toolbar('Contrast', 'eye', ['standard', 'more']),
  },
  initialGlobals: {
    theme: 'light',
    accent: 'indigo',
    neutral: 'stone',
    density: 'comfortable',
    radius: 'md',
    contrast: 'standard',
  },
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    // Every component's docs page: best practices, playground, AI prompt, tokens, accessibility.
    docs: { page: PadaDocsPage },
    // 'todo' reports violations in the a11y panel without failing the story.
    a11y: { test: 'todo' },
    options: {
      storySort: {
        order: [
          'Docs',
          ['Introduction', 'Getting started', 'Theming', 'Tokens', 'Foundations', ['Colour', 'Typography', 'Spacing & density', 'Radius', 'Elevation', 'Motion', 'Icons'], 'Use with AI', 'Legacy & migration'],
          'Actions',
          'Forms',
          'Dates',
          'Overlays',
          'Feedback',
          'Navigation',
          'Data',
          'Display',
          'Layout',
        ],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
