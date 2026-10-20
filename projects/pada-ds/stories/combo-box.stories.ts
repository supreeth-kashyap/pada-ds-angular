import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ComboBoxComponent, ComboBoxMenuItemComponent, type ComboBoxItem } from 'pada-ds-angular';

const owners: ComboBoxItem[] = [
  { id: 'ada', label: 'Ada Lovelace', iconName: 'user_default', selected: true },
  { id: 'grace', label: 'Grace Hopper', iconName: 'user_default' },
  { id: 'alan', label: 'Alan Turing', iconName: 'user_default', selected: true },
  { id: 'team', label: 'Platform team', iconName: 'team', disabled: true },
];

const grouped: ComboBoxItem[] = [
  { id: 'dashboard', label: 'Dashboard', iconName: 'dashboard', group: 'Pages' },
  { id: 'reports', label: 'Reports', iconName: 'reports', group: 'Pages', selected: true },
  { id: 'team', label: 'Team', iconName: 'team', group: 'Settings' },
  { id: 'security', label: 'Security', iconName: 'security', group: 'Settings' },
];

const meta: Meta<ComboBoxComponent> = {
  title: 'Forms/ComboBox',
  component: ComboBoxComponent,
  args: { items: owners, multiSelect: true },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 280px"><ds-combo-box aria-label="Owners" [items]="items" [multiSelect]="multiSelect" /></div>`,
  }),
};
export default meta;
type Story = StoryObj<ComboBoxComponent>;

export const MultiSelect: Story = {};
export const SingleSelect: Story = {
  args: { multiSelect: false, items: owners.map((o) => ({ ...o, selected: o.id === 'grace' })) },
};
export const Grouped: Story = { args: { items: grouped, multiSelect: false } };
export const MenuItem: Story = {
  decorators: [moduleMetadata({ imports: [ComboBoxMenuItemComponent] })],
  render: () => ({
    template: `
      <div role="listbox" aria-label="Views" style="max-width: 240px; display: grid">
        <button dsComboBoxMenuItem iconName="team" [selected]="true">Team</button>
        <button dsComboBoxMenuItem iconName="folder">Projects</button>
        <button dsComboBoxMenuItem iconName="lock" disabled>Archived</button>
      </div>`,
  }),
};
