import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import {
  BadgeComponent,
  ButtonComponent,
  ThemeParts,
  ThemeProviderComponent,
  ThemeToggleComponent,
} from 'pada-ds-angular';

type ThemeArgs = ThemeProviderComponent & {
  theme: 'light' | 'dark' | 'system';
  accent: string | undefined;
  accentHue: number | undefined;
  density: 'compact' | 'comfortable' | 'spacious' | undefined;
  radius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | undefined;
  contrast: 'standard' | 'more' | undefined;
};

const meta: Meta<ThemeArgs> = {
  title: 'Layout/ThemeProvider',
  component: ThemeProviderComponent,
  decorators: [moduleMetadata({ imports: [...ThemeParts, ButtonComponent, BadgeComponent] })],
  argTypes: {
    theme: { control: 'select', options: ['light', 'dark', 'system'] },
    accent: { control: 'select', options: [undefined, 'blue', 'indigo', 'emerald', 'amber', 'fuchsia', 'custom'] },
    density: { control: 'select', options: [undefined, 'compact', 'comfortable', 'spacious'] },
    radius: { control: 'select', options: [undefined, 'none', 'sm', 'md', 'lg', 'xl'] },
    contrast: { control: 'select', options: [undefined, 'standard', 'more'] },
  },
  args: { theme: 'light' },
  render: (args) => ({
    props: args,
    template: `
      <ds-theme-provider [theme]="theme" [accent]="accent" [accentHue]="accentHue" [density]="density"
        [radius]="radius" [contrast]="contrast">
        <div style="padding: 24px; background: var(--pada-color-surface); color: var(--pada-color-fg); display: flex; gap: 12px; align-items: center">
          <button dsButton>Primary</button>
          <button dsButton variant="secondary">Secondary</button>
          <ds-badge>Badge</ds-badge>
          <button dsThemeToggle aria-label="Toggle theme"></button>
        </div>
      </ds-theme-provider>`,
  }),
};
export default meta;
type Story = StoryObj<ThemeArgs>;

export const Default: Story = {};
export const Dark: Story = { args: { theme: 'dark' } };
export const Accent: Story = { args: { accent: 'emerald' } };
export const CustomHue: Story = { args: { accent: 'custom', accentHue: 140 } };
export const Compact: Story = { args: { density: 'compact', radius: 'none' } };
export const MoreContrast: Story = { args: { contrast: 'more' } };

export const Toggle: StoryObj<ThemeToggleComponent> = {
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
  args: { size: 'md' },
  render: (args) => ({
    props: args,
    template: `
      <ds-theme-provider defaultTheme="light">
        <div style="padding: 24px; background: var(--pada-color-surface)">
          <button dsThemeToggle [size]="size" aria-label="Toggle theme"></button>
        </div>
      </ds-theme-provider>`,
  }),
};
