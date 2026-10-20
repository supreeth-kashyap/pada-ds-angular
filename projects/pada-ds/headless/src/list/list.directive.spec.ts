import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DsVisuallyHidden } from '../utils/visually-hidden';
import { DsListParts } from './list.directive';

const names: Record<string, string> = { a: 'Alpha', b: 'Bravo', c: 'Charlie' };

@Component({
  selector: 'ds-list-host',
  imports: [DsListParts, DsVisuallyHidden],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div dsList #tasks="dsList" draggable aria-label="Tasks" (reorder)="onReorder($event)">
      @for (id of order(); track id) {
        <div dsListItem [value]="id">
          <button dsListDragHandle>⠿</button>
          <span dsListItemContent>{{ names[id] }}</span>
        </div>
      }
    </div>
    <div dsVisuallyHidden dsListAnnouncer [list]="tasks"></div>
  `,
})
class Host {
  readonly names = names;
  readonly order = signal(['a', 'b', 'c']);
  readonly reorders: string[][] = [];
  onReorder(order: string[]) {
    this.reorders.push(order);
    this.order.set(order);
  }
}

const texts = () =>
  screen.getAllByRole('listitem').map((item) => item.querySelector('span')?.textContent);

async function setup() {
  const result = await render(Host);
  await settle(result.fixture);
  return { ...result, host: result.fixture.componentInstance };
}

describe('DsList', () => {
  it('is a labelled list with a named toggle handle per item', async () => {
    const { container } = await setup();
    expect(screen.getByRole('list', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Bravo' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('draggable', 'true');
    await expectNoA11yViolations(container);
  });

  it('lifts with Space, moves with arrows, drops with Space, keeping focus on the handle', async () => {
    const { fixture, host } = await setup();
    const handle = screen.getByRole('button', { name: 'Move Alpha' });
    handle.focus();
    await userEvent.keyboard(' ');
    await settle(fixture);
    expect(handle).toHaveAttribute('aria-pressed', 'true');
    expect(handle.closest('[role="listitem"]')).toHaveAttribute('data-lifted');
    expect(document.body).toHaveTextContent('Alpha lifted, position 1 of 3.');
    expect(screen.getByRole('list').querySelector('[data-lifted]')).toBe(
      handle.closest('[role="listitem"]'),
    );
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    expect(texts()).toEqual(['Bravo', 'Charlie', 'Alpha']);
    expect(host.reorders.at(-1)).toEqual(['b', 'c', 'a']);
    expect(screen.getByRole('button', { name: 'Move Alpha' })).toHaveFocus();
    expect(document.body).toHaveTextContent('Alpha moved to position 3 of 3.');
    await userEvent.keyboard(' ');
    await settle(fixture);
    expect(screen.getByRole('button', { name: 'Move Alpha' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('Escape puts a lifted item back; Home moves it to the top', async () => {
    const { fixture } = await setup();
    screen.getByRole('button', { name: 'Move Charlie' }).focus();
    await userEvent.keyboard(' {Home}');
    await settle(fixture);
    expect(texts()).toEqual(['Charlie', 'Alpha', 'Bravo']);
    await userEvent.keyboard('{Escape}');
    await settle(fixture);
    expect(texts()).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(document.body).toHaveTextContent(
      'Reordering cancelled. Charlie returned to position 3 of 3.',
    );
  });

  it('ignores arrows on a handle that is not lifted', async () => {
    const { fixture, host } = await setup();
    screen.getByRole('button', { name: 'Move Alpha' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    expect(host.reorders).toEqual([]);
  });

  it('ends the lift when focus leaves the handle', async () => {
    const { fixture } = await setup();
    const handle = screen.getByRole('button', { name: 'Move Alpha' });
    handle.focus();
    await userEvent.keyboard(' ');
    await settle(fixture);
    screen.getByRole('button', { name: 'Move Bravo' }).focus();
    await settle(fixture);
    expect(handle).toHaveAttribute('aria-pressed', 'false');
  });
});
