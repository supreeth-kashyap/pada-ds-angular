import type { Meta, StoryObj } from '@storybook/angular';
import { NumberInputComponent } from 'pada-ds-angular';

const meta: Meta<NumberInputComponent> = {
  title: 'Forms/NumberInput',
  component: NumberInputComponent,
  argTypes: {
    stepper: { control: 'select', options: ['stacked', 'split', 'none'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: {
    label: 'Seats',
    value: 5,
    min: 1,
    max: 50,
    step: 1,
    stepper: 'stacked',
    size: 'md',
    disabled: false,
    readonly: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 240px">
        <ds-number-input [label]="label" [(value)]="value" [min]="min" [max]="max" [step]="step" [stepper]="stepper" [size]="size"
                         [formatOptions]="formatOptions" [locale]="locale" [description]="description" [error]="error"
                         [disabled]="disabled" [readonly]="readonly" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<NumberInputComponent>;

export const Default: Story = {};
export const Currency: Story = {
  args: {
    label: 'Budget',
    value: 1200,
    min: 0,
    max: Infinity,
    step: 100,
    locale: 'en-US',
    stepper: 'split',
    formatOptions: { style: 'currency', currency: 'USD' },
  },
};
export const Percent: Story = {
  args: {
    label: 'Discount',
    value: 0.15,
    min: 0,
    max: 1,
    step: 0.05,
    formatOptions: { style: 'percent' },
  },
};
export const NoStepper: Story = { args: { stepper: 'none' } };
export const Error: Story = { args: { error: 'Pick between 1 and 50 seats.' } };
export const Disabled: Story = { args: { disabled: true } };
