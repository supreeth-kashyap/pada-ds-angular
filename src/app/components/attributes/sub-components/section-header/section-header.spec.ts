import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SectionHeaderComponent, SectionHeaderData } from './section-header';

function setup(data: SectionHeaderData) {
  const fixture = TestBed.createComponent(SectionHeaderComponent);
  fixture.componentRef.setInput('data', data);
  fixture.detectChanges();
  return fixture;
}

describe('SectionHeaderComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SectionHeaderComponent] }));

  it('renders the section label', () => {
    const { nativeElement } = setup({ label: 'Section A' });
    expect(nativeElement.querySelector('.section-header__label').textContent.trim()).toBe('Section A');
  });

  it('hides tooltip when tooltip is absent', () => {
    const { nativeElement } = setup({ label: 'Section A' });
    expect(nativeElement.querySelector('ds-info-tooltip')).toBeNull();
  });

  it('shows a focusable tooltip named after the label when provided', () => {
    const fixture = setup({ label: 'Section A', tooltip: 'More info' });
    const trigger = fixture.nativeElement.querySelector('ds-info-tooltip button') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-label')).toBe('More info about Section A');
    trigger.focus();
    fixture.detectChanges();
    const popup = fixture.nativeElement.querySelector('ds-info-tooltip [role="tooltip"]') as HTMLElement;
    expect(popup.hidden).toBe(false);
    expect(popup.textContent?.trim()).toBe('More info');
  });

  it('hides slot when slot is empty', () => {
    const { nativeElement } = setup({ label: 'Section A' });
    expect(nativeElement.querySelector('.section-header__slot')).toBeNull();
  });

  it('renders slot button and emits on click', () => {
    const { nativeElement, componentInstance } = setup({
      label: 'Section A',
      slot: [{ type: 'button', label: 'Action' }],
    });
    const spy = vi.fn();
    componentInstance.slotClicked.subscribe(spy);
    nativeElement.querySelector('ds-button button').click();
    expect(spy).toHaveBeenCalledWith({ type: 'button', label: 'Action' });
  });

  it('renders slot badge', () => {
    const { nativeElement } = setup({
      label: 'Section A',
      slot: [{ type: 'badge', label: 'New' }],
    });
    expect(nativeElement.querySelector('ds-badge')).not.toBeNull();
  });
});
