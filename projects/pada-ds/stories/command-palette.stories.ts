import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import {
  ButtonComponent,
  CommandPaletteComponent,
  KbdComponent,
  type CommandPaletteCommand,
} from 'pada-ds-angular';

const commands: CommandPaletteCommand[] = [
  { id: 'new-project', label: 'New project', group: 'Create', icon: 'add', shortcut: ['⌘', 'N'] },
  {
    id: 'invite',
    label: 'Invite member',
    group: 'Create',
    icon: 'user_add',
    keywords: ['team', 'people'],
  },
  { id: 'dashboard', label: 'Go to dashboard', group: 'Navigate', icon: 'dashboard' },
  {
    id: 'reports',
    label: 'Go to reports',
    group: 'Navigate',
    icon: 'reports',
    description: 'Monthly and quarterly',
  },
  { id: 'settings', label: 'Open settings', group: 'Navigate', icon: 'cog', shortcut: ['⌘', ','] },
  {
    id: 'theme',
    label: 'Toggle theme',
    group: 'Preferences',
    icon: 'switch',
    keywords: ['dark', 'light'],
  },
  { id: 'logout', label: 'Log out', group: 'Preferences', icon: 'logout', disabled: true },
];

const meta: Meta<CommandPaletteComponent> = {
  title: 'Overlays/CommandPalette',
  component: CommandPaletteComponent,
  decorators: [moduleMetadata({ imports: [ButtonComponent, KbdComponent] })],
  args: {
    commands,
    open: false,
    placeholder: 'Type a command or search…',
    emptyMessage: 'No results',
  },
  render: (args) => ({
    props: args,
    template: `
      <p>Press <kbd dsKbd [keys]="['⌘', 'K']"></kbd> or <button dsButton size="sm" variant="secondary" (click)="open = true">Open palette</button></p>
      <ds-command-palette [commands]="commands" [(open)]="open" [placeholder]="placeholder" [emptyMessage]="emptyMessage" />`,
  }),
};
export default meta;
type Story = StoryObj<CommandPaletteComponent>;

export const Default: Story = {};
export const Open: Story = { args: { open: true } };
