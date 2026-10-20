import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { DsTagGroupItem, DsTagGroupParts } from './tag-group.directive';

interface Host {
  tags: string[];
  drop(tag: string): void;
}

const template = `
  <div dsTagGroup aria-label="Filters" [disabled]="disabled">
    @for (tag of tags; track tag) {
      <span role="listitem">
        {{ tag }}
        <button dsTagGroupItem [attr.aria-label]="'Remove ' + tag" (remove)="drop(tag)">×</button>
      </span>
    }
  </div>
`;

async function renderGroup(tags = ['Design', 'Q3', 'Owner'], disabled = false) {
  const result = await render(template, {
    imports: [...DsTagGroupParts],
    componentProperties: {
      tags,
      disabled,
      drop(this: Host, tag: string) {
        this.tags = this.tags.filter((entry) => entry !== tag);
      },
    },
  });
  const button = (name: string) => screen.getByRole('button', { name: `Remove ${name}` });
  return { ...result, button };
}

describe('DsTagGroup', () => {
  it('is a named list with one tab stop and arrow keys between the tags', async () => {
    const { fixture, button } = await renderGroup();
    expect(screen.getByRole('list', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(button('Design')).toHaveAttribute('tabindex', '0');
    expect(button('Q3')).toHaveAttribute('tabindex', '-1');
    expect(button('Design')).toHaveAttribute('type', 'button');

    await userEvent.tab();
    expect(button('Design')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(button('Q3')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(button('Owner')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(button('Design')).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(button('Owner')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(button('Design')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await settle(fixture);
    expect(button('Owner')).toHaveFocus();
    expect(button('Owner')).toHaveAttribute('tabindex', '0');
    expect(button('Design')).toHaveAttribute('tabindex', '-1');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('removes a tag with Delete or Backspace and moves focus to the next, then the previous', async () => {
    const { fixture, button } = await renderGroup();
    button('Q3').focus();
    await userEvent.keyboard('{Delete}');
    await settle(fixture);
    expect(screen.queryByRole('button', { name: 'Remove Q3' })).toBeNull();
    expect(button('Owner')).toHaveFocus();

    await userEvent.keyboard('{Backspace}');
    await settle(fixture);
    expect(button('Design')).toHaveFocus();

    await userEvent.keyboard('{Delete}');
    await settle(fixture);
    expect(screen.getByRole('list', { name: 'Filters' })).toHaveFocus();
  });

  it('removes a tag on click and keeps focus in the group', async () => {
    const { fixture, button } = await renderGroup();
    await userEvent.click(button('Design'));
    await settle(fixture);
    expect(screen.queryByRole('button', { name: 'Remove Design' })).toBeNull();
    expect(button('Q3')).toHaveFocus();
  });

  it('disables every remove button with the group', async () => {
    const { button } = await renderGroup(['Design'], true);
    expect(button('Design')).toBeDisabled();
    expect(screen.getByRole('list')).toHaveAttribute('data-disabled');
  });

  it('works without a group as a plain remove button', async () => {
    const remove = vi.fn();
    await render(`<button dsTagGroupItem aria-label="Remove" (remove)="remove()">×</button>`, {
      imports: [DsTagGroupItem],
      componentProperties: { remove },
    });
    const button = screen.getByRole('button', { name: 'Remove' });
    expect(button).not.toHaveAttribute('tabindex');
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Backspace}');
    expect(remove).toHaveBeenCalledTimes(2);
  });
});
