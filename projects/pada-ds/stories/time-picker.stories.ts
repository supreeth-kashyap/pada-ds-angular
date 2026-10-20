import type { Meta, StoryObj } from '@storybook/angular';
import { TimePickerComponent } from 'pada-ds-angular';

const meta: Meta<TimePickerComponent> = {
  title: 'Dates/TimePicker',
  component: TimePickerComponent,
  argTypes: {
    granularity: { control: 'select', options: ['minute', 'second'] },
    hourCycle: { control: 'select', options: [undefined, 12, 24] },
    minuteStep: { control: 'select', options: [1, 5, 15, 30] },
  },
  args: {
    label: 'Start time',
    value: null,
    granularity: 'minute',
    minuteStep: 1,
    required: false,
    optional: false,
    disabled: false,
    readonly: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 280px">
        <ds-time-picker [label]="label" [description]="description" [error]="error" [(value)]="value"
          [granularity]="granularity" [hourCycle]="hourCycle" [locale]="locale" [minuteStep]="minuteStep"
          [min]="min" [max]="max" [required]="required" [optional]="optional" [disabled]="disabled" [readonly]="readonly" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<TimePickerComponent>;

export const Default: Story = {};
export const WithValue: Story = { args: { value: '09:30', hourCycle: 12, locale: 'en-US' } };
export const TwentyFourHour: Story = { args: { label: 'Alarm', value: '06:45:00', granularity: 'second', hourCycle: 24 } };
export const QuarterHours: Story = { args: { minuteStep: 15, value: '14:15' } };
export const OfficeHours: Story = {
  args: { label: 'Meeting', min: '09:00', max: '18:00', value: '19:30', description: 'Between 9:00 and 18:00.' },
};
export const Error: Story = { args: { error: 'Enter a start time.', required: true } };
export const Disabled: Story = { args: { disabled: true, value: '12:00' } };
export const ReadOnly: Story = { args: { readonly: true, value: '08:00' } };
