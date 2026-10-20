import type { Meta, StoryObj } from '@storybook/angular';
import { SliderComponent } from 'pada-ds-angular';

const meta: Meta<SliderComponent> = {
  title: 'Forms/Slider',
  component: SliderComponent,
  args: { label: 'Volume', value: 40, min: 0, max: 100, step: 1, showValue: true, disabled: false },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 360px">
        <ds-slider [label]="label" [(value)]="value" [min]="min" [max]="max" [step]="step" [showValue]="showValue"
                   [description]="description" [error]="error" [disabled]="disabled" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<SliderComponent>;

export const Default: Story = {};
export const Stepped: Story = {
  args: { label: 'Rating threshold', value: 3, min: 1, max: 5, step: 1 },
};
export const WithDescription: Story = { args: { description: 'Applies to every device.' } };
export const Error: Story = { args: { value: 95, error: 'Above 90% may damage speakers.' } };
export const Disabled: Story = { args: { disabled: true } };
