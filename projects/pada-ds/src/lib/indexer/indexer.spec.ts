import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { IndexerComponent, IndexerItem } from './indexer';

const items: IndexerItem[] = [
  { id: 'install', label: 'Install' },
  { id: 'usage', label: 'Usage' },
  { id: 'api', label: 'API' },
];

/** jsdom has no layout: place the sections at fixed page offsets. */
function placeSections(tops: number[]) {
  items.forEach((item, index) => {
    document.getElementById(item.id)!.getBoundingClientRect = () =>
      ({ top: tops[index] - window.scrollY }) as DOMRect;
  });
}

const scrollTo = (y: number) => {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
  window.dispatchEvent(new Event('scroll'));
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function setup(activeIndexChange = vi.fn()) {
  const result = await render(
    `<ds-indexer [items]="items" offset="100" (activeIndexChange)="activeIndexChange($event)" />
     <section id="install">Install</section>
     <section id="usage">Usage</section>
     <section id="api">API</section>`,
    { imports: [IndexerComponent], componentProperties: { items, activeIndexChange } },
  );
  placeSections([0, 800, 1600]);
  // The first measurement ran before the sections had positions; measure again.
  scrollTo(0);
  await wait(30);
  await settle(result.fixture);
  return { ...result, activeIndexChange };
}

describe('Indexer', () => {
  afterEach(() => scrollTo(0));

  it('is a named navigation list with the first entry current', async () => {
    const { fixture } = await setup();
    await settle(fixture);
    expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Install' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Usage' })).not.toHaveAttribute('aria-current');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('follows the scroll position', async () => {
    const { fixture, activeIndexChange } = await setup();
    await settle(fixture);
    scrollTo(750);
    await wait(30);
    await settle(fixture);
    expect(screen.getByRole('button', { name: 'Usage' })).toHaveAttribute('aria-current', 'true');
    expect(activeIndexChange).toHaveBeenLastCalledWith(1);
    scrollTo(1700);
    await wait(30);
    await settle(fixture);
    expect(screen.getByRole('button', { name: 'API' })).toHaveAttribute('aria-current', 'true');
  });

  it('scrolls a clicked section into view and keeps it active while scrolling there', async () => {
    const { fixture, activeIndexChange } = await setup();
    const api = document.getElementById('api')!;
    api.scrollIntoView = vi.fn();
    await userEvent.click(screen.getByRole('button', { name: 'API' }));
    await settle(fixture);
    expect(api.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(activeIndexChange).toHaveBeenLastCalledWith(2);
    // Passing the middle section on the way does not move the marker back.
    scrollTo(800);
    await wait(30);
    await settle(fixture);
    expect(screen.getByRole('button', { name: 'API' })).toHaveAttribute('aria-current', 'true');
  });
});
