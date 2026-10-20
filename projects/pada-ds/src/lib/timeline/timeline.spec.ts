import { render, screen, within } from '@testing-library/angular';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { TimelineData, TimelineParts } from './timeline';
import { toTimelineData } from './timeline.adapter';

const data: TimelineData = {
  items: [
    {
      id: 'placed',
      title: 'Order placed',
      time: new Date('2026-03-01T10:00:00Z'),
      tone: 'success',
      icon: 'tick_1',
    },
    { id: 'shipped', title: 'Shipped', time: 'Yesterday', description: 'Left the warehouse' },
    { id: 'delivered', title: 'Delivered', pending: true },
  ],
};

describe('Timeline', () => {
  it('renders an ordered list of events with times, tones and pending state', async () => {
    const { fixture } = await render(`<ds-timeline [data]="data" density="compact" />`, {
      imports: [...TimelineParts],
      componentProperties: { data },
    });
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(fixture.nativeElement.querySelector('ds-timeline')).toHaveAttribute(
      'data-density',
      'compact',
    );

    const time = items[0].querySelector('time');
    expect(time).toHaveAttribute('datetime', '2026-03-01T10:00:00.000Z');
    expect(time?.textContent?.trim()).toBe(
      new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date('2026-03-01T10:00:00Z'),
      ),
    );
    expect(items[0]).toHaveAttribute('data-tone', 'success');
    expect(items[0].querySelector('.timeline-marker')).toHaveAttribute('aria-hidden', 'true');
    expect(items[1]).toHaveAttribute('data-tone', 'neutral');
    expect(items[1].querySelector('time')).toBeNull();
    expect(items[1]).toHaveTextContent('Yesterday');
    expect(items[1]).toHaveTextContent('Left the warehouse');
    expect(items[2]).toHaveAttribute('data-pending', '');
    expect(items[2].style.getPropertyValue('--pada-timeline-index')).toBe('2');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('renders custom details from a template', async () => {
    await render(
      `<ds-timeline [data]="data">
         <ng-template dsTimelineItemContent let-item><em>{{ item.title }} details</em></ng-template>
       </ds-timeline>`,
      { imports: [...TimelineParts], componentProperties: { data } },
    );
    expect(screen.getByText('Shipped details').tagName).toBe('EM');
    expect(screen.queryByText('Left the warehouse')).toBeNull();
  });
});

describe('toTimelineData', () => {
  it('parses dates, maps statuses to tones and fills blanks', () => {
    expect(
      toTimelineData([
        { id: 7, title: ' Paid ', timestamp: '2026-01-02T03:04:05Z', status: 'Completed' },
        { title: null, timestamp: '3 days ago', status: 'unknown', pending: true },
        { id: null, timestamp: 0, description: 'Epoch', icon: 'bell', status: 'failed' },
      ]),
    ).toEqual({
      items: [
        { id: '7', title: 'Paid', time: new Date('2026-01-02T03:04:05Z'), tone: 'success' },
        { id: '1', title: 'Untitled event', time: '3 days ago', pending: true },
        {
          id: '2',
          title: 'Untitled event',
          time: new Date(0),
          description: 'Epoch',
          icon: 'bell',
          tone: 'danger',
        },
      ],
    });
    expect(toTimelineData(null)).toEqual({ items: [] });
  });
});
