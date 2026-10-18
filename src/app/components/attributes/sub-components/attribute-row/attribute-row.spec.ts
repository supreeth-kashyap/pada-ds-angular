import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { AttributeRowComponent, AttributeRowData } from './attribute-row';
import { AttributeButtonValueComponent } from './attribute-button-value';

function setup(data: AttributeRowData) {
  const fixture = TestBed.createComponent(AttributeRowComponent);
  fixture.componentRef.setInput('data', data);
  fixture.detectChanges();
  return fixture;
}

describe('AttributeRowComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [AttributeRowComponent] }));

  it('renders the key label', () => {
    const { nativeElement } = setup({ key: 'Owner', value: [{ type: 'text', text: 'Alice' }] });
    expect(nativeElement.querySelector('.attr-row__key-text').textContent.trim()).toBe('Owner');
  });

  it('hides tooltip when tooltip is absent', () => {
    const { nativeElement } = setup({ key: 'Owner', value: [{ type: 'text', text: 'Alice' }] });
    expect(nativeElement.querySelector('ds-info-tooltip')).toBeNull();
  });

  it('shows a focusable tooltip named after the key when provided', () => {
    const fixture = setup({ key: 'Owner', tooltip: 'Help text', value: [{ type: 'text', text: 'Alice' }] });
    const trigger = fixture.nativeElement.querySelector('ds-info-tooltip button') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-label')).toBe('More info about Owner');
    trigger.focus();
    fixture.detectChanges();
    const popup = fixture.nativeElement.querySelector('ds-info-tooltip [role="tooltip"]') as HTMLElement;
    expect(popup.hidden).toBe(false);
    expect(popup.textContent?.trim()).toBe('Help text');
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
    expect(nativeElement.querySelector('button[dsButton]')).not.toBeNull();
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
    nativeElement.querySelector('button[dsButton]').click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ label: 'Edit', index: 0 });
  });

  it('tells two buttons in the same row apart by label and index', () => {
    const { nativeElement, componentInstance } = setup({
      key: 'Actions',
      value: [
        { type: 'button', label: 'Edit' },
        { type: 'text', text: 'or' },
        { type: 'button', label: 'Delete' },
      ],
    });
    const spy = vi.fn();
    componentInstance.buttonClicked.subscribe(spy);
    const buttons = nativeElement.querySelectorAll('button[dsButton]');
    buttons[1].click();
    buttons[0].click();
    expect(spy.mock.calls).toEqual([[{ label: 'Delete', index: 2 }], [{ label: 'Edit', index: 0 }]]);
  });

  it('keeps button value inputs stable across re-renders', () => {
    const fixture = setup({ key: 'Action', value: [{ type: 'button', label: 'Edit' }] });
    const button = fixture.debugElement.query(By.directive(AttributeButtonValueComponent))
      .componentInstance as AttributeButtonValueComponent;
    const firstHandler = button.onClicked();
    fixture.debugElement.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();
    expect(button.onClicked()).toBe(firstHandler);
  });
});
