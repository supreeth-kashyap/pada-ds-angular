import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { ListParts } from './list';

const names: Record<string, string> = { a: 'Alpha', b: 'Bravo', c: 'Charlie' };

@Component({
  selector: 'ds-list-spec-host',
  imports: [ListParts],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ds-list [draggable]="draggable()" label="Tasks" (reorder)="onReorder($event)">
      @for (id of order(); track id) {
        <ds-list-item [value]="id">{{ names[id] }}</ds-list-item>
      }
    </ds-list>
  `,
})
class Host {
  readonly names = names;
  readonly draggable = signal(true);
  readonly order = signal(['a', 'b', 'c']);
  readonly reorders: string[][] = [];
  onReorder(order: string[]) {
    this.reorders.push(order);
    this.order.set(order);
  }
}

const texts = () =>
  screen
    .getAllByRole('listitem')
    .map((item) => item.querySelector('.list-item-content')?.textContent?.trim());

async function setup(draggable = true) {
  const result = await render(Host);
  result.fixture.componentInstance.draggable.set(draggable);
  await settle(result.fixture);
  return { ...result, host: result.fixture.componentInstance };
}

describe('ListComponent', () => {
  it('is a labelled list; a plain list has no handles', async () => {
    const { container } = await setup(false);
    expect(screen.getByRole('list', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByRole('button')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('gives a draggable list a named handle per item', async () => {
    const { container } = await setup();
    expect(screen.getByRole('button', { name: 'Move Bravo' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expectNoA11yViolations(container);
  });

  it('reorders with the keyboard and announces each step', async () => {
    const { fixture, host } = await setup();
    screen.getByRole('button', { name: 'Move Alpha' }).focus();
    for (const key of [' ', '{ArrowDown}', '{ArrowDown}']) {
      await userEvent.keyboard(key);
      await settle(fixture);
    }
    expect(texts()).toEqual(['Bravo', 'Charlie', 'Alpha']);
    expect(host.reorders.at(-1)).toEqual(['b', 'c', 'a']);
    expect(screen.getByRole('button', { name: 'Move Alpha' })).toHaveFocus();
    expect(document.body).toHaveTextContent('Alpha moved to position 3 of 3.');
    await userEvent.keyboard(' ');
    await settle(fixture);
    expect(document.body).toHaveTextContent('Alpha dropped at position 3 of 3.');
  });

  it('Escape puts a lifted item back', async () => {
    const { fixture } = await setup();
    screen.getByRole('button', { name: 'Move Charlie' }).focus();
    for (const key of [' ', '{ArrowUp}', '{ArrowUp}', '{Escape}']) {
      await userEvent.keyboard(key);
      await settle(fixture);
    }
    expect(texts()).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(document.body).toHaveTextContent(
      'Reordering cancelled. Charlie returned to position 3 of 3.',
    );
  });
});
