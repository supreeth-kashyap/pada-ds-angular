import type { Meta, StoryObj } from '@storybook/angular';
import { ColorPickerComponent } from 'pada-ds-angular';

const meta: Meta<ColorPickerComponent> = {
  title: 'Forms/ColorPicker',
  component: ColorPickerComponent,
  argTypes: {
    format: { control: 'select', options: ['hex', 'oklch'] },
    value: { control: 'text' },
  },
  args: { label: 'Accent colour', value: '#4f46e5', format: 'hex', swatches: [], disabled: false },
  render: (args) => ({
    props: args,
    template: `<ds-color-picker [label]="label" [(value)]="value" [format]="format" [swatches]="swatches" [disabled]="disabled" />`,
  }),
};
export default meta;
type Story = StoryObj<ColorPickerComponent>;

export const Default: Story = {};
export const WithSwatches: Story = {
  args: {
    swatches: [
      { value: '#ef4444', label: 'Red' },
      { value: '#f59e0b', label: 'Amber' },
      { value: '#22c55e', label: 'Green' },
      { value: '#0ea5e9', label: 'Sky' },
      { value: '#8b5cf6', label: 'Violet' },
    ],
  },
};
export const Oklch: Story = {
  args: { label: 'Brand', format: 'oklch', value: 'oklch(62.8% 0.258 29.2)' },
};
export const Disabled: Story = { args: { disabled: true } };
