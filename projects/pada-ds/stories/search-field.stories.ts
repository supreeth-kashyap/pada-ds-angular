import type { Meta, StoryObj } from '@storybook/angular';
import { SearchFieldComponent } from 'pada-ds-angular';

const meta: Meta<SearchFieldComponent> = {
  title: 'Forms/SearchField',
  component: SearchFieldComponent,
  args: { placeholder: 'Search members', value: '', disabled: false },
  render: (args) => ({
    props: args,
    template: `<div style="max-width: 280px"><ds-search-field [placeholder]="placeholder" [(value)]="value" [disabled]="disabled" /></div>`,
  }),
};
export default meta;
type Story = StoryObj<SearchFieldComponent>;

export const Default: Story = {};
export const WithText: Story = { args: { value: 'ada' } };
export const Disabled: Story = { args: { disabled: true } };
