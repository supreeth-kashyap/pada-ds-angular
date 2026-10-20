import type { Meta, StoryObj } from '@storybook/angular';
import { SegmentControlComponent, type SegmentOption } from 'pada-ds-angular';

const views: SegmentOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year', disabled: true },
];

const meta: Meta<SegmentControlComponent> = {
  title: 'Forms/SegmentControl',
  component: SegmentControlComponent,
  args: { options: views, value: 'week', disabled: false },
  render: (args) => ({
    props: args,
    template: `<ds-segment-control [options]="options" [(value)]="value" [disabled]="disabled" aria-label="View" />`,
  }),
};
export default meta;
type Story = StoryObj<SegmentControlComponent>;

export const Default: Story = {};
export const Unset: Story = { args: { value: null } };
export const WithIcons: Story = {
  args: {
    value: 'list',
    options: [
      { value: 'list', icon: 'menu_2', label: 'List' },
      { value: 'board', icon: 'area', label: 'Board' },
    ],
  },
};
export const IconOnly: Story = {
  args: {
    value: 'list',
    options: [
      { value: 'list', icon: 'menu_2', ariaLabel: 'List view' },
      { value: 'board', icon: 'area', ariaLabel: 'Board view' },
      { value: 'calendar', icon: 'calendar_3', ariaLabel: 'Calendar view' },
    ],
  },
};
export const Disabled: Story = { args: { disabled: true } };
