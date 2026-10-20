import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ButtonComponent, EmptyStateComponent } from 'pada-ds-angular';

const meta: Meta<EmptyStateComponent> = {
  title: 'Feedback/EmptyState',
  component: EmptyStateComponent,
  decorators: [moduleMetadata({ imports: [ButtonComponent] })],
  argTypes: { size: { control: 'select', options: ['sm', 'md'] } },
  args: {
    media: 'folder',
    title: 'No projects yet',
    description: 'Create one to start.',
    size: 'md',
  },
  render: (args) => ({
    props: args,
    template: `
      <ds-empty-state [media]="media" [title]="title" [description]="description" [size]="size">
        <button dsButton leftIcon="add">New project</button>
      </ds-empty-state>`,
  }),
};
export default meta;
type Story = StoryObj<EmptyStateComponent>;

export const FirstUse: Story = {};
export const NoResults: Story = {
  args: {
    media: 'search',
    title: 'No results',
    description: 'Try a different search or clear the filters.',
  },
  render: (args) => ({
    props: args,
    template: `
      <ds-empty-state [media]="media" [title]="title" [description]="description" [size]="size">
        <button dsButton variant="secondary">Clear filters</button>
      </ds-empty-state>`,
  }),
};
export const Small: Story = { args: { size: 'sm' } };
