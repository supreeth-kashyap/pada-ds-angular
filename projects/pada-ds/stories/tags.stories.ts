import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { TagGroupParts, TagsComponent } from 'pada-ds-angular';

const meta: Meta<TagsComponent> = {
  title: 'Display/Tags',
  component: TagsComponent,
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'primary', 'secondary', 'success', 'danger', 'royal'],
    },
  },
  args: { variant: 'neutral', removable: false, disabled: false },
  render: (args) => ({
    props: args,
    template: `<ds-tag [variant]="variant" [icon]="icon" [removable]="removable" [disabled]="disabled">Design</ds-tag>`,
  }),
};
export default meta;
type Story = StoryObj<TagsComponent>;

export const Default: Story = {};
export const Success: Story = { args: { variant: 'success', icon: 'tick_1' } };
export const Removable: Story = { args: { variant: 'primary', removable: true } };
export const Disabled: Story = { args: { removable: true, disabled: true } };
export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap">
        <ds-tag variant="neutral">Neutral</ds-tag>
        <ds-tag variant="primary">Primary</ds-tag>
        <ds-tag variant="secondary">Secondary</ds-tag>
        <ds-tag variant="success">Success</ds-tag>
        <ds-tag variant="danger">Danger</ds-tag>
        <ds-tag variant="royal">Royal</ds-tag>
      </div>`,
  }),
};
export const Group: Story = {
  decorators: [moduleMetadata({ imports: [...TagGroupParts] })],
  render: () => {
    const filters = signal(['Design', 'Q3', 'Owner: Ada', 'High priority']);
    return {
      props: {
        filters,
        drop: (filter: string) => filters.update((all) => all.filter((f) => f !== filter)),
      },
      template: `
      <ds-tag-group label="Filters">
        @for (filter of filters(); track filter) {
          <ds-tag removable (remove)="drop(filter)">{{ filter }}</ds-tag>
        }
      </ds-tag-group>`,
    };
  },
};
