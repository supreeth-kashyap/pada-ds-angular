import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { SidebarData, SidebarParts } from './sidebar';

const data: SidebarData = {
  title: 'Acme',
  sections: [
    {
      label: 'Workspace',
      icon: 'dashboard',
      items: [
        { id: 'home', label: 'Home', href: '/home', icon: 'dashboard' },
        { id: 'team', label: 'Team', icon: 'team', trailing: '3' },
        { id: 'audits', label: 'Audits', href: '/audits', disabled: true },
      ],
    },
    {
      items: [{ id: 'settings', label: 'Settings', icon: '/assets/cog.svg', selected: true }],
    },
  ],
};

describe('Sidebar', () => {
  it('renders the logo, sections and items from data, marking the active item', async () => {
    const { fixture } = await render(`<ds-sidebar [data]="data" activeId="team" />`, {
      imports: [...SidebarParts],
      componentProperties: { data },
    });
    await settle(fixture);
    expect(screen.getByRole('complementary', { name: 'Sidebar' })).toBeInTheDocument();
    expect(screen.getByText('Acme')).toHaveClass('sidebar-logo-title');
    expect(screen.getByRole('group', { name: 'Workspace' })).toBeInTheDocument();

    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('href', '/home');
    expect(home).not.toHaveAttribute('aria-current');
    const team = screen.getByRole('button', { name: 'Team 3' });
    expect(team).toHaveAttribute('aria-current', 'page');
    expect(team).toHaveAttribute('data-selected', '');
    // A disabled item with a link renders as a disabled button, as in React.
    expect(screen.queryByRole('link', { name: 'Audits' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Audits' })).toBeDisabled();
    // `selected` on the item wins over activeId.
    const settings = screen.getByRole('button', { name: 'Settings' });
    expect(settings).toHaveAttribute('aria-current', 'page');
    expect(settings.querySelector('img')).toHaveAttribute('src', '/assets/cog.svg');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('reports item clicks', async () => {
    const itemClick = vi.fn();
    await render(`<ds-sidebar [data]="data" (itemClick)="itemClick($event)" />`, {
      imports: [...SidebarParts],
      componentProperties: { data, itemClick },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Team 3' }));
    expect(itemClick).toHaveBeenCalledWith(
      expect.objectContaining({ item: data.sections[0].items[1] }),
    );
  });

  it('shows the default Pada logo, a custom image, or no logo header', async () => {
    const { rerender } = await render(`<ds-sidebar [data]="data" />`, {
      imports: [...SidebarParts],
      componentProperties: { data: { sections: [] } as SidebarData },
    });
    expect(screen.getByRole('img', { name: 'Pada' })).toBeInTheDocument();
    await rerender({
      componentProperties: { data: { logo: '/logo.png', title: 'Acme', sections: [] } },
    });
    expect(document.querySelector('img.sidebar-logo-mark')).toHaveAttribute('src', '/logo.png');
    await rerender({
      componentProperties: { data: { logo: { title: 'Acme', href: '/' }, sections: [] } },
    });
    expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute('href', '/');
    await rerender({ componentProperties: { data: { logo: null, sections: [] } } });
    expect(document.querySelector('ds-sidebar-logo')).toBeNull();
  });

  it('composes parts, with links, disabled links and trailing content', async () => {
    const { fixture } = await render(
      `<ds-sidebar label="Main">
         <ds-sidebar-logo title="Acme" />
         <ds-sidebar-body>
           <ds-sidebar-search placeholder="Find" [(value)]="query" />
           <ds-sidebar-section label="Pages">
             <a dsSidebarMenu href="/" icon="dashboard" selected>Dashboard</a>
             <a dsSidebarMenu href="/old" disabled>Archive</a>
             <button dsSidebarMenu>Reports <span dsSidebarMenuTrailing>New</span></button>
           </ds-sidebar-section>
         </ds-sidebar-body>
       </ds-sidebar>`,
      { imports: [...SidebarParts], componentProperties: { query: '' } },
    );
    await settle(fixture);
    expect(screen.getByRole('complementary', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    const archive = screen.getByRole('link', { name: 'Archive' });
    expect(archive).toHaveAttribute('aria-disabled', 'true');
    expect(archive).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('button', { name: 'Reports New' })).toHaveAttribute('type', 'button');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Find' }), 'risk');
    await settle(fixture);
    expect((fixture.componentInstance as unknown as { query: string }).query).toBe('risk');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('collapses and expands a group', async () => {
    const { fixture } = await render(
      `<ds-sidebar-collapse label="More"><a dsSidebarMenu href="/x">Extra</a></ds-sidebar-collapse>`,
      { imports: [...SidebarParts] },
    );
    const trigger = screen.getByRole('button', { name: 'More' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Extra' })).toBeNull();
    await userEvent.click(trigger);
    await settle(fixture);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const link = screen.getByRole('link', { name: 'Extra' });
    expect(trigger).toHaveAttribute('aria-controls', link.parentElement!.id);
    await expectNoA11yViolations(fixture.nativeElement);
  });
});
