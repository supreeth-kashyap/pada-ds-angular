import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import {
  DescriptionListComponent,
  DescriptionListData,
  DescriptionListHeader,
  DescriptionListHeaderComponent,
  DescriptionListRow,
  DescriptionListRowComponent,
} from './description-list';

interface ThumbnailValueData {
  text: string;
  imageUrl: string;
  imageAlt?: string;
}

/** A custom value component, as an app would pass one. */
@Component({
  selector: 'ds-test-thumbnail-value',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<img [src]="data().imageUrl" [alt]="data().imageAlt ?? data().text" /><span
      class="thumbnail-text"
      >{{ data().text }}</span
    >`,
})
class ThumbnailValueComponent {
  readonly data = input.required<ThumbnailValueData>();
}

const DATA: DescriptionListData = {
  sections: [
    {
      header: { label: 'Section A', tooltip: 'Info about section A' },
      rows: [
        { key: 'Status', value: [{ type: 'text', text: 'Active' }] },
        { key: 'Tag', tooltip: 'Current state', value: [{ type: 'badge', label: 'New' }] },
      ],
    },
    {
      header: { label: 'Section B', slot: [{ type: 'button', label: 'Action' }] },
      rows: [
        {
          key: 'Owner',
          value: [{ type: 'avatar', name: 'Anna Banks', initials: 'AB', subtitle: 'HR @company' }],
        },
        {
          key: 'Edit',
          value: [
            { type: 'text', text: 'Last edited 2 days ago' },
            { type: 'button', label: 'Edit record' },
          ],
        },
      ],
    },
  ],
};

describe('DescriptionListComponent', () => {
  it('renders named sections as description lists of terms and values', async () => {
    const { container } = await render(`<ds-description-list [data]="data" />`, {
      imports: [DescriptionListComponent],
      componentProperties: { data: DATA },
    });
    expect(screen.getByRole('group', { name: 'Section A' })).toBeInTheDocument();
    const sectionB = screen.getByRole('group', { name: 'Section B' });
    expect(container.querySelectorAll('dl')).toHaveLength(2);
    expect(container.querySelectorAll('dl > div[dsDescriptionListRow]')).toHaveLength(4);
    const terms = Array.from(container.querySelectorAll('dt')).map((dt) =>
      dt.querySelector('.description-list-key-text')?.textContent?.trim(),
    );
    expect(terms).toEqual(['Status', 'Tag', 'Owner', 'Edit']);
    expect(sectionB.querySelectorAll('dd')[1]).toHaveTextContent('Last edited 2 days ago');
    await expectNoA11yViolations(container);
  });

  it('emits section-slot-click when a slot button is pressed', async () => {
    const onAction = vi.fn();
    await render(`<ds-description-list [data]="data" (action)="onAction($event)" />`, {
      imports: [DescriptionListComponent],
      componentProperties: { data: DATA, onAction },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Action' }));
    expect(onAction).toHaveBeenCalledWith({
      type: 'section-slot-click',
      sectionLabel: 'Section B',
      item: { type: 'button', label: 'Action' },
    });
  });

  it('emits row-button-click when a row button is pressed', async () => {
    const onAction = vi.fn();
    await render(`<ds-description-list [data]="data" (action)="onAction($event)" />`, {
      imports: [DescriptionListComponent],
      componentProperties: { data: DATA, onAction },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Edit record' }));
    expect(onAction).toHaveBeenCalledWith({
      type: 'row-button-click',
      sectionLabel: 'Section B',
      key: 'Edit',
      label: 'Edit record',
      index: 1,
    });
  });

  it('distinguishes two buttons in the same row', async () => {
    const onAction = vi.fn();
    const data: DescriptionListData = {
      sections: [
        {
          header: { label: 'Section C' },
          rows: [
            {
              key: 'Actions',
              value: [
                { type: 'button', label: 'Approve' },
                { type: 'button', label: 'Reject' },
              ],
            },
          ],
        },
      ],
    };
    await render(`<ds-description-list [data]="data" (action)="onAction($event)" />`, {
      imports: [DescriptionListComponent],
      componentProperties: { data, onAction },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
    expect(onAction.mock.calls).toEqual([
      [
        {
          type: 'row-button-click',
          sectionLabel: 'Section C',
          key: 'Actions',
          label: 'Approve',
          index: 0,
        },
      ],
      [
        {
          type: 'row-button-click',
          sectionLabel: 'Section C',
          key: 'Actions',
          label: 'Reject',
          index: 1,
        },
      ],
    ]);
  });

  it('renders custom components and templates as values', async () => {
    const { container } = await render(
      `<ng-template #status let-state="state"><em class="state">{{ state }}</em></ng-template>
       <ds-description-list
         [data]="{ sections: [{ header: { label: 'Assets' }, rows: [
           { key: 'Preview', value: [{ type: 'custom', component: thumbnail, inputs: { data: thumb } }] },
           { key: 'State', value: [{ type: 'template', template: status, context: { state: 'Ready' } }] }
         ] }] }"
       />`,
      {
        imports: [DescriptionListComponent],
        componentProperties: {
          thumbnail: ThumbnailValueComponent,
          thumb: { text: 'Brand cover', imageUrl: '/cover.png' } satisfies ThumbnailValueData,
        },
      },
    );
    expect(container.querySelector('dd ds-test-thumbnail-value .thumbnail-text')).toHaveTextContent(
      'Brand cover',
    );
    expect(screen.getByRole('img', { name: 'Brand cover' })).toHaveAttribute('src', '/cover.png');
    expect(container.querySelector('dd em.state')).toHaveTextContent('Ready');
    await expectNoA11yViolations(container);
  });
});

describe('DescriptionListRowComponent', () => {
  function setup(data: DescriptionListRow) {
    const fixture = TestBed.createComponent(DescriptionListRowComponent);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => TestBed.configureTestingModule({ imports: [DescriptionListRowComponent] }));

  it('renders the key in a dt and hides the tooltip without one', () => {
    const { nativeElement } = setup({ key: 'Owner', value: [{ type: 'text', text: 'Alice' }] });
    expect(nativeElement.querySelector('dt .description-list-key-text')).toHaveTextContent('Owner');
    expect(nativeElement.querySelector('ds-info-tooltip')).toBeNull();
    expect(nativeElement.querySelector('dd .description-list-text')).toHaveTextContent('Alice');
  });

  it('shows a focusable tooltip named after the key', async () => {
    const fixture = setup({ key: 'Owner', tooltip: 'Help text', value: [] });
    const trigger = fixture.nativeElement.querySelector('ds-info-tooltip button');
    expect(trigger).toHaveAttribute('aria-label', 'More info about Owner');
    trigger.focus();
    await settle(fixture);
    const popup = fixture.nativeElement.querySelector('[role="tooltip"]') as HTMLElement;
    expect(popup.hidden).toBe(false);
    expect(popup).toHaveTextContent('Help text');
  });

  it('renders the avatar lockup with name and optional subtitle', () => {
    const { nativeElement } = setup({
      key: 'Owner',
      value: [
        { type: 'avatar', name: 'Anna Banks', initials: 'AB', subtitle: 'HR @company' },
        { type: 'avatar', name: 'Ben Chu' },
      ],
    });
    const [anna, ben] = Array.from<HTMLElement>(
      nativeElement.querySelectorAll('.description-list-avatar'),
    );
    expect(anna.querySelector('.description-list-avatar-name')).toHaveTextContent('Anna Banks');
    expect(anna.querySelector('.description-list-avatar-subtitle')).toHaveTextContent(
      'HR @company',
    );
    expect(anna.querySelector('ds-avatar')).toHaveTextContent('AB');
    expect(anna.querySelector('.description-list-avatar-picture')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(ben.querySelector('.description-list-avatar-subtitle')).toBeNull();
    expect(ben.querySelector('ds-avatar')).toHaveTextContent('BC');
  });

  it('lays out the avatar lockup as a flex row', () => {
    const { nativeElement } = setup({ key: 'Owner', value: [{ type: 'avatar', name: 'A B' }] });
    const lockup = nativeElement.querySelector('.description-list-avatar') as HTMLElement;
    expect(getComputedStyle(lockup).display).toBe('flex');
    expect(getComputedStyle(lockup).flexDirection).toBe('row');
  });

  it('renders badge values with their tone', () => {
    const { nativeElement } = setup({
      key: 'Tag',
      value: [
        { type: 'badge', label: 'New', tone: 'success' },
        { type: 'badge', label: 'Old' },
      ],
    });
    const badges = nativeElement.querySelectorAll('ds-badge');
    expect(badges[0]).toHaveTextContent('New');
    expect(badges[0]).toHaveAttribute('data-tone', 'success');
    expect(badges[1]).toHaveAttribute('data-tone', 'neutral');
  });

  it('tells two buttons in the same row apart by label and index, and honours disabled', () => {
    const fixture = setup({
      key: 'Actions',
      value: [
        { type: 'button', label: 'Edit' },
        { type: 'text', text: 'or' },
        { type: 'button', label: 'Delete' },
        { type: 'button', label: 'Archive', disabled: true },
      ],
    });
    const spy = vi.fn();
    fixture.componentInstance.buttonClicked.subscribe(spy);
    const buttons = fixture.nativeElement.querySelectorAll('button[dsButton]');
    buttons[1].click();
    buttons[0].click();
    expect(spy.mock.calls).toEqual([
      [{ label: 'Delete', index: 2 }],
      [{ label: 'Edit', index: 0 }],
    ]);
    expect(buttons[2]).toBeDisabled();
  });

  it('keeps custom component inputs stable across re-renders', () => {
    const inputs = { data: { text: 'Cover', imageUrl: '/c.png' } };
    const fixture = setup({
      key: 'Preview',
      value: [{ type: 'custom', component: ThumbnailValueComponent, inputs }],
    });
    const rendered = () =>
      fixture.debugElement.query(By.directive(ThumbnailValueComponent))
        .componentInstance as ThumbnailValueComponent;
    const first = rendered();
    fixture.componentRef.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(rendered()).toBe(first);
    expect(first.data()).toBe(inputs.data);
  });
});

describe('DescriptionListHeaderComponent', () => {
  function setup(data: DescriptionListHeader) {
    const fixture = TestBed.createComponent(DescriptionListHeaderComponent);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => TestBed.configureTestingModule({ imports: [DescriptionListHeaderComponent] }));

  it('renders the label without tooltip or slot by default', () => {
    const { nativeElement } = setup({ label: 'Section A' });
    expect(nativeElement.querySelector('.description-list-header-label')).toHaveTextContent(
      'Section A',
    );
    expect(nativeElement.querySelector('ds-info-tooltip')).toBeNull();
    expect(nativeElement.querySelector('.description-list-header-slot')).toBeNull();
  });

  it('shows a tooltip named after the label', () => {
    const { nativeElement } = setup({ label: 'Section A', tooltip: 'More info' });
    expect(nativeElement.querySelector('ds-info-tooltip button')).toHaveAttribute(
      'aria-label',
      'More info about Section A',
    );
  });

  it('renders slot buttons that emit, and slot badges', () => {
    const fixture = setup({
      label: 'Section A',
      slot: [
        { type: 'button', label: 'Action' },
        { type: 'badge', label: 'New', tone: 'accent' },
      ],
    });
    const spy = vi.fn();
    fixture.componentInstance.slotClicked.subscribe(spy);
    fixture.nativeElement.querySelector('button[dsButton]').click();
    expect(spy).toHaveBeenCalledWith({ type: 'button', label: 'Action' });
    expect(fixture.nativeElement.querySelector('ds-badge')).toHaveAttribute('data-tone', 'accent');
  });
});
