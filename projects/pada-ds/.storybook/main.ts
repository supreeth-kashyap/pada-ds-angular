import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.ts'],
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/angular',
  // The app's public/ (favicon, Pada logo) is served alongside the stories.
  staticDirs: ['../../../public'],
};

export default config;
