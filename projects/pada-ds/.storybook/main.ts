import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  // stories/docs holds the Docs pages, synced from the pada repo with the shared blocks in
  // .storybook/pada-docs (see that repo's scripts/sync-storybook-angular.mjs).
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/angular',
  // The app's public/ (favicon, Pada logo) is served alongside the stories.
  staticDirs: ['../../../public'],
};

export default config;
