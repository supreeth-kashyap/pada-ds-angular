import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { HoverCardParts } from './hover-card';

async function setup() {
  const result = await render(
    `<p>
       Reviewed by
       <ds-hover-card [openDelay]="500" [closeDelay]="200" (openChange)="changes.push($event)">
         <a href="/people/ada" dsHoverCardTrigger>&#64;ada</a>
         <ds-hover-card-content>
           <span>Ada Lovelace, Engineering</span>
           <a href="/people/ada/repos">Repositories</a>
           <ds-hover-card-arrow />
         </ds-hover-card-content>
       </ds-hover-card>
     </p>
     <button>Elsewhere</button>`,
    { imports: [...HoverCardParts], componentProperties: { changes: [] as boolean[] } },
  );
  const link = screen.getByRole('link', { name: '@ada' });
  // Timers are faked after the first render so Angular's own scheduling has settled.
  vi.useFakeTimers();
  const advance = (ms: number) => {
    vi.advanceTimersByTime(ms);
    result.fixture.detectChanges();
    TestBed.tick();
  };
  return { ...result, link, advance };
}

const card = () => screen.queryByText('Ada Lovelace, Engineering');

describe('HoverCard', () => {
  afterEach(() => vi.useRealTimers());

  it('opens after the delay on hover and stays open while the pointer is on the card', async () => {
    const { link, advance, fixture } = await setup();
    expect(link).toHaveAttribute('data-state', 'closed');
    fireEvent.pointerEnter(link, { pointerType: 'mouse' });
    advance(400);
    expect(card()).toBeNull();
    advance(100);
    const panel = card()!.closest<HTMLElement>('.hover-card')!;
    expect(link).toHaveAttribute('data-state', 'open');
    expect(panel).toHaveAttribute('data-state', 'open');
    expect(panel).toHaveAttribute('data-side', 'bottom');
    expect(panel).toHaveAttribute('data-pada-layer');
    expect(panel.querySelector('ds-hover-card-arrow')).toHaveAttribute('aria-hidden', 'true');
    // Hovering does not move focus.
    expect(document.body).toHaveFocus();

    // Moving from the link to the card keeps it open.
    fireEvent.pointerLeave(link, { pointerType: 'mouse' });
    fireEvent.pointerEnter(panel, { pointerType: 'mouse' });
    advance(500);
    expect(card()).toBeInTheDocument();
    fireEvent.pointerLeave(panel, { pointerType: 'mouse' });
    advance(199);
    expect(card()).toBeInTheDocument();
    advance(1);
    expect(card()).toBeNull();
    expect(fixture.componentInstance.changes).toEqual([true, false]);
    vi.useRealTimers();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('ignores touch pointers', async () => {
    const { link, advance } = await setup();
    fireEvent.pointerEnter(link, { pointerType: 'touch' });
    advance(1000);
    expect(card()).toBeNull();
  });

  it('opens on keyboard focus and closes on Escape', async () => {
    const { link, advance } = await setup();
    link.focus();
    advance(500);
    expect(card()).toBeInTheDocument();
    // Focus stays on the link.
    expect(link).toHaveFocus();
    fireEvent.keyDown(link, { key: 'Escape' });
    advance(0);
    expect(link).toHaveAttribute('data-state', 'closed');
    advance(500);
    expect(card()).toBeNull();
  });

  it('stays open while focus moves into the card and closes when it leaves', async () => {
    const { link, advance } = await setup();
    link.focus();
    advance(500);
    const inner = screen.getByRole('link', { name: 'Repositories' });
    link.blur();
    inner.focus();
    advance(500);
    expect(card()).toBeInTheDocument();
    screen.getByRole('button', { name: 'Elsewhere' }).focus();
    advance(200);
    expect(card()).toBeNull();
  });

  it('closes on a pointer-down outside but not on the trigger', async () => {
    const { link, advance } = await setup();
    link.focus();
    advance(500);
    advance(0);
    fireEvent.pointerDown(link);
    advance(0);
    expect(card()).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Elsewhere' }));
    advance(0);
    expect(card()).toBeNull();
  });
});
