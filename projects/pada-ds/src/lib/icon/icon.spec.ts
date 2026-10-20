import { render, screen, waitFor } from '@testing-library/angular';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { IconComponent } from './icon';
import { getBuiltInIcon, loadIconNames } from './icon-markup';

describe('IconComponent', () => {
  it('renders a built-in icon in the current colour, sized by the size input', async () => {
    const { container } = await render(`<ds-icon name="tick_1" [size]="16" />`, {
      imports: [IconComponent],
    });
    const host = container.querySelector('ds-icon')!;
    await waitFor(() => expect(host.querySelector('svg')).not.toBeNull());
    const svg = host.querySelector('svg')!;
    expect(svg).toHaveAttribute('width', '100%');
    expect(svg.outerHTML).toContain('currentColor');
    expect(host).toHaveStyle({ '--pada-icon-box': '16px' });
    expect(host).toHaveAttribute('aria-hidden', 'true');
  });

  it('is an image with a name when given a label', async () => {
    const { container } = await render(`<ds-icon name="search" label="Search" />`, {
      imports: [IconComponent],
    });
    expect(screen.getByRole('img', { name: 'Search' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('takes a colour override, and inherits the text colour without one', async () => {
    const { container } = await render(
      `<ds-icon name="tick_1" color="var(--pada-color-success-fg)" /><ds-icon name="cross_1" />`,
      { imports: [IconComponent] },
    );
    const [coloured, plain] = Array.from(container.querySelectorAll('ds-icon')) as HTMLElement[];
    expect(coloured.style.color).toBe('var(--pada-color-success-fg)');
    expect(plain.style.color).toBe('');
  });

  it('renders inline SVG markup passed as src without a request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { container } = await render(
      `<ds-icon src='<svg viewBox="0 0 10 10" width="10" height="10"><path fill="#000" d="M0 0h10v10z"/></svg>' />`,
      { imports: [IconComponent] },
    );
    const svg = container.querySelector('ds-icon svg')!;
    expect(svg.querySelector('path')).toHaveAttribute('fill', 'currentColor');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('falls back to Material Symbols for unknown names, and renders nothing when that fails', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('Not found', { status: 404 }));
    const { container } = await render(`<ds-icon name="not_an_icon" />`, {
      imports: [IconComponent],
    });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/not_an_icon.svg');
    expect(container.querySelector('ds-icon svg')).toBeNull();
    fetchSpy.mockRestore();
  });

  it('lists and looks up the built-in icons', async () => {
    const names = await loadIconNames();
    expect(names).toContain('chevron_down');
    expect(names).toEqual([...names].sort());
    expect(await getBuiltInIcon('chevron_down')).toMatch(/^<svg/);
    expect(await getBuiltInIcon('nope')).toBeUndefined();
  });
});
