import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { TagGroupParts } from './tag-group';

interface Host {
  filters: string[];
  drop(filter: string): void;
}

describe('TagGroupComponent', () => {
  async function renderGroup() {
    return render(
      `<ds-tag-group label="Filters">
        @for (filter of filters; track filter) {
          <ds-tag removable (remove)="drop(filter)">{{ filter }}</ds-tag>
        }
        <ds-tag variant="success">Fixed</ds-tag>
      </ds-tag-group>`,
      {
        imports: [...TagGroupParts],
        componentProperties: {
          filters: ['Design', 'Q3', 'Owner'],
          drop(this: Host, filter: string) {
            this.filters = this.filters.filter((entry) => entry !== filter);
          },
        },
      },
    );
  }
  const remove = (name: string) => screen.getByRole('button', { name: `Remove ${name}` });

  it('is a named list of tags with one tab stop', async () => {
    const { fixture } = await renderGroup();
    const list = screen.getByRole('list', { name: 'Filters' });
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(list).toHaveAttribute('tabindex', '-1');
    expect(remove('Design')).toHaveAttribute('tabindex', '0');
    expect(remove('Q3')).toHaveAttribute('tabindex', '-1');
    await userEvent.tab();
    expect(remove('Design')).toHaveFocus();
    await userEvent.tab();
    expect(document.body).toHaveFocus();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('moves with the arrow keys and removes with Delete, keeping focus in the group', async () => {
    const { fixture } = await renderGroup();
    remove('Design').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(remove('Q3')).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(remove('Owner')).toHaveFocus();
    await userEvent.keyboard('{Delete}');
    await settle(fixture);
    expect(screen.queryByText('Owner')).toBeNull();
    expect(remove('Q3')).toHaveFocus();
    await userEvent.click(remove('Design'));
    await settle(fixture);
    expect(remove('Q3')).toHaveFocus();
    expect(remove('Q3')).toHaveAttribute('tabindex', '0');
  });
});
