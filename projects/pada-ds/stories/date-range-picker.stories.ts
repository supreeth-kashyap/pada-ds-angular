import type { Meta, StoryObj } from '@storybook/angular';
import { DateRangePickerComponent, type DateRangePreset } from 'pada-ds-angular';
import { addDays, isWeekend, today } from './sample-dates';

const presets: DateRangePreset[] = [
  { label: 'Last 7 days', range: [addDays(-6), today] },
  { label: 'Last 30 days', range: [addDays(-29), today] },
  { label: 'This month', range: [new Date(2026, 9, 1), new Date(2026, 9, 31)] },
  { label: 'Last quarter', range: [new Date(2026, 6, 1), new Date(2026, 8, 30)] },
];

const meta: Meta<DateRangePickerComponent> = {
  title: 'Dates/DateRangePicker',
  component: DateRangePickerComponent,
  argTypes: {
    weekStartsOn: { control: 'select', options: [0, 1, 6] },
    numberOfMonths: { control: 'select', options: [1, 2] },
    value: { control: false },
    minDate: { control: false },
    maxDate: { control: false },
  },
  args: {
    label: 'Stay',
    placeholder: 'Select dates',
    value: null,
    weekStartsOn: 0,
    numberOfMonths: 2,
    presets: [],
    required: false,
    disabled: false,
  },
  render: (args) => ({
    props: { ...args, today },
    template: `
      <div style="max-width: 360px; padding-bottom: 420px">
        <ds-date-range-picker [label]="label" [description]="description" [error]="error" [placeholder]="placeholder"
          [(value)]="value" [today]="today" [minDate]="minDate" [maxDate]="maxDate" [isDateUnavailable]="isDateUnavailable"
          [weekStartsOn]="weekStartsOn" [numberOfMonths]="numberOfMonths" [presets]="presets"
          [required]="required" [disabled]="disabled" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<DateRangePickerComponent>;

export const Default: Story = {};
export const WithValue: Story = { args: { value: [addDays(4), addDays(9)] } };
export const Presets: Story = { args: { label: 'Report period', presets, weekStartsOn: 1 } };
export const Weekdays: Story = {
  args: { label: 'Booking', minDate: today, isDateUnavailable: isWeekend, description: 'Weekdays only.' },
};
export const OneMonth: Story = { args: { numberOfMonths: 1 } };
export const Error: Story = { args: { error: 'Pick the dates of your stay.' } };
export const Disabled: Story = { args: { disabled: true, value: [addDays(1), addDays(3)] } };
