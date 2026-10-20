import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { AvatarComponent, AvatarGroupComponent } from 'pada-ds-angular';
import { portrait } from './sample-images';

const meta: Meta<AvatarComponent> = {
  title: 'Display/Avatar',
  component: AvatarComponent,
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    shape: { control: 'select', options: ['circle', 'square'] },
    status: { control: 'select', options: [undefined, 'online', 'away', 'busy', 'offline'] },
  },
  args: { name: 'Ada Lovelace', size: 'lg', shape: 'circle' },
  render: (args) => ({
    props: args,
    template: `<ds-avatar [name]="name" [src]="src" [size]="size" [shape]="shape" [status]="status" />`,
  }),
};
export default meta;
type Story = StoryObj<AvatarComponent>;

export const Initials: Story = {};
export const Image: Story = { args: { src: portrait(250) } };
export const WithStatus: Story = { args: { src: portrait(30), status: 'online' } };
export const Square: Story = { args: { name: 'Pada', shape: 'square' } };
export const NoName: Story = { args: { name: undefined } };
export const Group: Story = {
  decorators: [moduleMetadata({ imports: [AvatarGroupComponent] })],
  render: () => ({
    props: {
      members: [
        { id: 1, name: 'Ada Lovelace', photo: portrait(250) },
        { id: 2, name: 'Grace Hopper' },
        { id: 3, name: 'Alan Turing', photo: portrait(120) },
        { id: 4, name: 'Katherine Johnson' },
        { id: 5, name: 'Edsger Dijkstra' },
      ],
    },
    template: `
      <ds-avatar-group label="Project members" [max]="3" size="sm">
        @for (member of members; track member.id) {
          <ds-avatar [name]="member.name" [src]="member.photo" />
        }
      </ds-avatar-group>`,
  }),
};
