import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { CalendarComponent, CalendarParts } from 'pada-ds-angular';
import { addDays, isWeekend, today } from './sample-dates';

type CalendarArgs = CalendarComponent & {
  mode: 'single' | 'range';
  value: Date | null;
  range: [Date, Date?] | null;
  weekStartsOn: number;
  locale: string | undefined;
  disabled: boolean;
  readOnly: boolean;
};

const meta: Meta<CalendarArgs> = {
  title: 'Dates/Calendar',
  component: CalendarComponent,
  decorators: [moduleMetadata({ imports: [...CalendarParts] })],
  argTypes: {
    mode: { control: 'select', options: ['single', 'range'] },
    weekStartsOn: { control: 'select', options: [0, 1, 6] },
    value: { control: false },
    range: { control: false },
  },
  args: { mode: 'single', value: addDays(3), range: null, weekStartsOn: 0, disabled: false, readOnly: false },
  render: (args) => ({
    props: { ...args, today },
    template: `
      <ds-calendar [mode]="mode" [(value)]="value" [(range)]="range" [today]="today" [weekStartsOn]="weekStartsOn"
        [locale]="locale" [disabled]="disabled" [readOnly]="readOnly" />`,
  }),
};
export default meta;
type Story = StoryObj<CalendarArgs>;

export const Default: Story = {};
export const Range: Story = { args: { mode: 'range', value: null, range: [addDays(-2), addDays(4)] } };
export const WeekStartsMonday: Story = { args: { weekStartsOn: 1, locale: 'en-GB' } };
export const Limits: Story = {
  render: (args) => ({
    props: { ...args, today, min: today, max: addDays(30), isWeekend },
    template: `<ds-calendar [(value)]="value" [today]="today" [min]="min" [max]="max" [isDateUnavailable]="isWeekend" />`,
  }),
};
export const Disabled: Story = { args: { disabled: true } };
export const Composed: Story = {
  render: () => ({
    props: { today, stay: [addDays(-3), addDays(9)] },
    template: `
      <ds-calendar-root mode="range" [(range)]="stay" [today]="today" [numberOfMonths]="2">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px">
          <ds-calendar-prev-button />
          <ds-calendar-heading />
          <ds-calendar-next-button />
        </div>
        <div style="display: flex; gap: 24px">
          <ds-calendar-grid hideOutsideDays />
          <div>
            <ds-calendar-heading [monthOffset]="1" />
            <ds-calendar-grid hideOutsideDays [monthOffset]="1" />
          </div>
        </div>
      </ds-calendar-root>`,
  }),
};
