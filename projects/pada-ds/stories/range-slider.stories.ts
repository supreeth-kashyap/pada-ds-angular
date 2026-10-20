import type { Meta, StoryObj } from '@storybook/angular';
import { RangeSliderComponent } from 'pada-ds-angular';

const meta: Meta<RangeSliderComponent> = {
  title: 'Forms/RangeSlider',
  component: RangeSliderComponent,
  args: {
    label: 'Price',
    value: [120, 380],
    min: 0,
    max: 500,
    step: 10,
    locale: 'en-US',
    formatOptions: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    showValue: true,
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 360px">
        <ds-range-slider [label]="label" [(value)]="value" [min]="min" [max]="max" [step]="step" [locale]="locale"
                         [formatOptions]="formatOptions" [showValue]="showValue" [minStepsBetweenThumbs]="minStepsBetweenThumbs"
                         [description]="description" [error]="error" [disabled]="disabled" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<RangeSliderComponent>;

export const Default: Story = {};
export const Unset: Story = { args: { value: null } };
export const MinimumGap: Story = {
  args: { minStepsBetweenThumbs: 5, description: 'Keep at least $50 between the ends.' },
};
export const Disabled: Story = { args: { disabled: true } };
