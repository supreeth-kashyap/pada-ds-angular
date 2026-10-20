import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { SidebarComponent, SidebarParts, type SidebarData } from 'pada-ds-angular';
import { brandMark } from './sample-images';

const nav: SidebarData = {
  title: 'Acme',
  sections: [
    {
      id: 'workspace',
      label: 'Workspace',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '#' },
        { id: 'reports', label: 'Reports', icon: 'report', trailing: '12', href: '#' },
        { id: 'team', label: 'Team', icon: 'team', trailing: '3', href: '#' },
        { id: 'audits', label: 'Audits', icon: 'audits', href: '#' },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      items: [
        { id: 'security', label: 'Security', icon: 'security', href: '#' },
        { id: 'billing', label: 'Billing', icon: 'corporate', href: '#', disabled: true },
        { id: 'help', label: 'Help', icon: 'help' },
      ],
    },
  ],
};

const meta: Meta<SidebarComponent> = {
  title: 'Navigation/Sidebar',
  component: SidebarComponent,
  decorators: [moduleMetadata({ imports: [...SidebarParts] })],
  args: { data: nav, activeId: 'reports', label: 'Sidebar' },
  render: (args) => ({
    props: {
      ...args,
      go: (e: { event: MouseEvent }) => e.event.preventDefault(),
    },
    template: `
      <div style="height: 560px; width: 260px">
        <ds-sidebar [data]="data" [activeId]="activeId" [label]="label" (itemClick)="go($event)" />
      </div>`,
  }),
};
export default meta;
type Story = StoryObj<SidebarComponent>;

export const Default: Story = {};
export const ImageLogo: Story = {
  args: { data: { ...nav, logo: { src: brandMark(260, 'A'), alt: '', title: 'Acme' } } },
};
export const Composed: Story = {
  render: () => ({
    template: `
      <div style="height: 560px; width: 260px">
        <ds-sidebar>
          <ds-sidebar-logo title="Acme" href="#" />
          <ds-sidebar-body>
            <ds-sidebar-search />
            <ds-sidebar-section label="Workspace">
              <a dsSidebarMenu href="#" icon="dashboard" selected>Dashboard</a>
              <button dsSidebarMenu icon="team" trailing="3">Team</button>
              <button dsSidebarMenu icon="reports">Reports</button>
            </ds-sidebar-section>
            <ds-sidebar-section label="Compliance">
              <ds-sidebar-collapse label="Frameworks" open>
                <ul dsSidebarSectionMenu>
                  <li><a dsSidebarMenu href="#">SOC 2</a></li>
                  <li><a dsSidebarMenu href="#">ISO 27001</a></li>
                </ul>
              </ds-sidebar-collapse>
              <button dsSidebarMenu icon="policies">Policies</button>
            </ds-sidebar-section>
          </ds-sidebar-body>
        </ds-sidebar>
      </div>`,
  }),
};
