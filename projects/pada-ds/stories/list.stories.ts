import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ListComponent, ListParts } from 'pada-ds-angular';

type ListArgs = ListComponent & { draggable: boolean };

const tasks: Record<string, string> = {
  design: 'Design the onboarding flow',
  copy: 'Write the welcome email',
  build: 'Build the sign-up form',
  test: 'Test with five customers',
};

const meta: Meta<ListArgs> = {
  title: 'Layout/List',
  component: ListComponent,
  decorators: [moduleMetadata({ imports: [...ListParts] })],
  args: { label: 'Tasks', draggable: false },
  render: (args) => {
    const order = signal(Object.keys(tasks));
    return {
      props: { ...args, tasks, order, reorder: (ids: string[]) => order.set(ids) },
      template: `
        <div style="max-width: 360px">
          <ds-list [label]="label" [draggable]="draggable" (reorder)="reorder($event)">
            @for (id of order(); track id) {
              <ds-list-item [value]="id">{{ tasks[id] }}</ds-list-item>
            }
          </ds-list>
        </div>`,
    };
  },
};
export default meta;
type Story = StoryObj<ListArgs>;

export const Default: Story = {};
export const Draggable: Story = { args: { draggable: true } };
