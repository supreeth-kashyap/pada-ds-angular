import type { Meta, StoryObj } from '@storybook/angular';
import { CodeSnippetComponent } from 'pada-ds-angular';

const meta: Meta<CodeSnippetComponent> = {
  title: 'Display/CodeSnippet',
  component: CodeSnippetComponent,
  argTypes: {
    type: { control: 'select', options: ['micro', 'single-line', 'multi-line'] },
    language: {
      control: 'select',
      options: ['bash', 'typescript', 'javascript', 'json', 'yaml', 'python'],
    },
  },
  args: {
    type: 'multi-line',
    language: 'typescript',
    label: 'app.config.ts',
    showCopy: true,
    code: `import { provideTheme } from 'pada-ds-angular/headless';

export const appConfig = {
  providers: [provideTheme({ accent: 'indigo', density: 'comfortable' })],
};`,
  },
  render: (args) => ({
    props: args,
    template: `<ds-code-snippet [code]="code" [language]="language" [type]="type" [label]="label" [showCopy]="showCopy" />`,
  }),
};
export default meta;
type Story = StoryObj<CodeSnippetComponent>;

export const MultiLine: Story = {};
export const SingleLine: Story = {
  args: {
    type: 'single-line',
    language: 'bash',
    label: undefined,
    code: 'npm install pada-ds-angular',
  },
};
export const Micro: Story = {
  args: { type: 'micro', language: 'bash', label: undefined, code: 'ng serve' },
};
export const Json: Story = {
  args: {
    language: 'json',
    label: 'package.json',
    code: '{\n  "name": "my-app",\n  "private": true,\n  "version": "1.0.0"\n}',
  },
};
export const WithoutCopy: Story = { args: { showCopy: false } };
