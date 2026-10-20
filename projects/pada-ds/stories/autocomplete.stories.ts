import type { Meta, StoryObj } from '@storybook/angular';
import { AutocompleteComponent, type AutocompleteOption } from 'pada-ds-angular';

const people: AutocompleteOption[] = [
  { value: 'ada', label: 'Ada Lovelace', description: 'Engineering' },
  { value: 'grace', label: 'Grace Hopper', description: 'Platform' },
  { value: 'alan', label: 'Alan Turing', description: 'Research' },
  { value: 'katherine', label: 'Katherine Johnson', description: 'Data' },
  { value: 'edsger', label: 'Edsger Dijkstra', description: 'Infrastructure', disabled: true },
];

const meta: Meta<AutocompleteComponent> = {
  title: 'Forms/Autocomplete',
  component: AutocompleteComponent,
  args: {
    label: 'Assignee',
    options: people,
    placeholder: 'Search people',
    value: null,
    values: [],
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 320px">
        <ds-autocomplete [label]="label" [options]="options" [placeholder]="placeholder" [(value)]="value"
                         [description]="description" [error]="error" [disabled]="disabled" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<AutocompleteComponent>;

export const Default: Story = {};
export const Selected: Story = { args: { value: 'grace' } };
export const Multiple: Story = {
  args: { label: 'Reviewers', values: ['ada', 'alan'] },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 320px">
        <ds-autocomplete [label]="label" [options]="options" [placeholder]="placeholder" multiple [(values)]="values" />
      </div>`,
  }),
};
export const Error: Story = { args: { error: 'Assign someone before saving.' } };
export const Disabled: Story = { args: { disabled: true } };
