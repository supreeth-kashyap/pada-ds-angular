import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AttributeRowComponent, AttributeRowData } from './attribute-row';

function setup(data: AttributeRowData) {
  const fixture = TestBed.createComponent(AttributeRowComponent);
  fixture.componentInstance.data = data;
  fixture.detectChanges();
  return fixture;
}

describe('AttributeRowComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [AttributeRowComponent] }));

  it('renders the key label', () => {
    const { nativeElement } = setup({ key: 'Owner', value: [{ type: 'text', text: 'Alice' }] });
    expect(nativeElement.querySelector('.attr-row__key-text').textContent.trim()).toBe('Owner');
  });

  it('hides tooltip icon when tooltip is absent', () => {
    const { nativeElement } = setup({ key: 'Owner', value: [{ type: 'text', text: 'Alice' }] });
    expect(nativeElement.querySelector('.attr-row__tooltip-icon')).toBeNull();
  });

  it('shows tooltip icon with title when provided', () => {
    const { nativeElement } = setup({ key: 'Owner', tooltip: 'Help text', value: [{ type: 'text', text: 'Alice' }] });
    const icon = nativeElement.querySelector('.attr-row__tooltip-icon');
    expect(icon).not.toBeNull();
    expect(icon.getAttribute('title')).toBe('Help text');
  });

  it('renders a single text value', () => {
    const { nativeElement } = setup({ key: 'Status', value: [{ type: 'text', text: 'Active' }] });
    expect(nativeElement.querySelector('.attr-row__text').textContent.trim()).toBe('Active');
  });

  it('renders multiple values in the same row', () => {
    const { nativeElement } = setup({
      key: 'Record',
      value: [
        { type: 'text', text: 'Some description' },
        { type: 'button', label: 'Edit' },
      ],
    });
    expect(nativeElement.querySelector('.attr-row__text').textContent.trim()).toBe('Some description');
    expect(nativeElement.querySelector('ds-button')).not.toBeNull();
  });

  it('renders avatar lockup with name and subtitle', () => {
    const { nativeElement } = setup({
      key: 'Owner',
      value: [{ type: 'avatar', name: 'Anna Banks', initials: 'AB', subtitle: 'HR @company' }],
    });
    expect(nativeElement.querySelector('.attr-row__avatar-name').textContent.trim()).toBe('Anna Banks');
    expect(nativeElement.querySelector('.attr-row__avatar-subtitle').textContent.trim()).toBe('HR @company');
    expect(nativeElement.querySelector('ds-avatar')).not.toBeNull();
  });

  it('renders avatar without subtitle when not provided', () => {
    const { nativeElement } = setup({
      key: 'Owner',
      value: [{ type: 'avatar', name: 'Anna Banks', initials: 'AB' }],
    });
    expect(nativeElement.querySelector('.attr-row__avatar-subtitle')).toBeNull();
  });

  it('renders badge value', () => {
    const { nativeElement } = setup({ key: 'Tag', value: [{ type: 'badge', label: 'New' }] });
    expect(nativeElement.querySelector('ds-badge')).not.toBeNull();
  });

  it('renders button value and emits on click', () => {
    const { nativeElement, componentInstance } = setup({
      key: 'Action',
      value: [{ type: 'button', label: 'Edit' }],
    });
    const spy = vi.fn();
    componentInstance.buttonClicked.subscribe(spy);
    nativeElement.querySelector('ds-button button').click();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
