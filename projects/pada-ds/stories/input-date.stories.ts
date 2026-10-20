import type { Meta, StoryObj } from '@storybook/angular';
import { InputDateComponent } from 'pada-ds-angular';
import { addDays, today } from './sample-dates';

const meta: Meta<InputDateComponent> = {
  title: 'Dates/InputDate',
  component: InputDateComponent,
  argTypes: {
    mode: { control: 'select', options: ['date', 'month', 'year'] },
    selection: { control: 'select', options: ['single', 'range'] },
    value: { control: false },
    minDate: { control: false },
    maxDate: { control: false },
  },
  args: {
    label: 'Due date',
    placeholder: 'Select date',
    mode: 'date',
    selection: 'single',
    value: null,
    required: false,
    optional: false,
    disabled: false,
  },
  render: (args) => ({
    props: { ...args, today },
    template: `
      <div style="max-width: 320px; padding-bottom: 380px">
        <ds-input-date [label]="label" [description]="description" [error]="error" [placeholder]="placeholder"
          [mode]="mode" [selection]="selection" [(value)]="value" [today]="today" [minDate]="minDate" [maxDate]="maxDate"
          [required]="required" [optional]="optional" [disabled]="disabled" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<InputDateComponent>;

export const Default: Story = {};
export const WithValue: Story = { args: { value: addDays(7) } };
export const Range: Story = {
  args: { label: 'Trip', selection: 'range', value: [addDays(10), addDays(17)], description: 'Up to 14 nights.' },
};
export const Month: Story = { args: { label: 'Billing month', mode: 'month', value: today } };
export const FutureOnly: Story = { args: { minDate: today, description: 'Pick a day from today on.' } };
export const Required: Story = { args: { required: true } };
export const Error: Story = { args: { error: 'Pick a due date.' } };
export const Disabled: Story = { args: { disabled: true, value: addDays(2) } };
