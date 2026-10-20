import type { Meta, StoryObj } from '@storybook/angular';
import { DatePickerComponent } from 'pada-ds-angular';
import { addDays, isWeekend, today } from './sample-dates';

const meta: Meta<DatePickerComponent> = {
  title: 'Dates/DatePicker',
  component: DatePickerComponent,
  argTypes: {
    mode: { control: 'select', options: ['date', 'month', 'year'] },
    selection: { control: 'select', options: ['single', 'range'] },
    weekStartsOn: { control: 'select', options: [0, 1, 6] },
    value: { control: false },
    minDate: { control: false },
    maxDate: { control: false },
  },
  args: { mode: 'date', selection: 'single', value: addDays(5), weekStartsOn: 0, disabled: false },
  render: (args) => ({
    props: { ...args, today },
    template: `
      <ds-date-picker [mode]="mode" [selection]="selection" [(value)]="value" [today]="today" [minDate]="minDate"
        [maxDate]="maxDate" [isDateUnavailable]="isDateUnavailable" [weekStartsOn]="weekStartsOn" [locale]="locale"
        [disabled]="disabled" />`,
  }),
};
export default meta;
type Story = StoryObj<DatePickerComponent>;

export const Default: Story = {};
export const Range: Story = {
  args: { selection: 'range', value: [addDays(2), addDays(8)], locale: 'en-GB', weekStartsOn: 1 },
};
export const Month: Story = { args: { mode: 'month', value: today } };
export const Year: Story = { args: { mode: 'year', value: today } };
export const Limits: Story = {
  args: { value: null, minDate: today, maxDate: addDays(45), isDateUnavailable: isWeekend },
};
export const Disabled: Story = { args: { disabled: true } };
