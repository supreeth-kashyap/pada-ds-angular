import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AttributesComponent, AttributesData } from './attributes';

const MOCK_DATA: AttributesData = {
  sections: [
    {
      header: { label: 'Section A', tooltip: 'Info about section A' },
      rows: [
        { key: 'Status', value: [{ type: 'text', text: 'Active' }] },
        { key: 'Tag', value: [{ type: 'badge', label: 'New' }] },
      ],
    },
    {
      header: {
        label: 'Section B',
        slot: [{ type: 'button', label: 'Action' }],
      },
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

function setup(data: AttributesData = MOCK_DATA) {
  const fixture = TestBed.createComponent(AttributesComponent);
  fixture.componentInstance.data = data;
  fixture.detectChanges();
  return fixture;
}

describe('AttributesComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [AttributesComponent] }));

  it('renders all sections', () => {
    const { nativeElement } = setup();
    expect(nativeElement.querySelectorAll('.attributes__section').length).toBe(2);
  });

  it('renders section headers', () => {
    const { nativeElement } = setup();
    const headers = nativeElement.querySelectorAll('ds-section-header');
    expect(headers.length).toBe(2);
  });

  it('renders all attribute rows', () => {
    const { nativeElement } = setup();
    expect(nativeElement.querySelectorAll('ds-attribute-row').length).toBe(4);
  });

  it('emits section-slot-click when slot button is clicked', () => {
    const { nativeElement, componentInstance } = setup();
    const spy = vi.fn();
    componentInstance.action.subscribe(spy);
    nativeElement.querySelectorAll('ds-section-header')[1].querySelector('button').click();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'section-slot-click', sectionLabel: 'Section B' })
    );
  });

  it('emits row-button-click when row value button is clicked', () => {
    const { nativeElement, componentInstance } = setup();
    const spy = vi.fn();
    componentInstance.action.subscribe(spy);
    const rowButtons = nativeElement.querySelectorAll('ds-attribute-row ds-button button');
    rowButtons[rowButtons.length - 1].click();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'row-button-click', sectionLabel: 'Section B', key: 'Edit' })
    );
  });
});
