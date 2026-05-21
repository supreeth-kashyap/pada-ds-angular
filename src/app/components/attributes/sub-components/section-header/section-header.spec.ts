import { TestBed } from '@angular/core/testing';
import { SectionHeaderComponent, SectionHeaderData } from './section-header';

function setup(data: SectionHeaderData) {
  const fixture = TestBed.createComponent(SectionHeaderComponent);
  fixture.componentInstance.data = data;
  fixture.detectChanges();
  return fixture;
}

describe('SectionHeaderComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SectionHeaderComponent] }));

  it('renders the section label', () => {
    const { nativeElement } = setup({ label: 'Section A' });
    expect(nativeElement.querySelector('.section-header__label').textContent.trim()).toBe('Section A');
  });

  it('hides tooltip icon when tooltip is absent', () => {
    const { nativeElement } = setup({ label: 'Section A' });
    expect(nativeElement.querySelector('.section-header__tooltip-icon')).toBeNull();
  });

  it('shows tooltip icon when tooltip is provided', () => {
    const { nativeElement } = setup({ label: 'Section A', tooltip: 'More info' });
    const icon = nativeElement.querySelector('.section-header__tooltip-icon');
    expect(icon).not.toBeNull();
    expect(icon.getAttribute('title')).toBe('More info');
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
    const spy = jasmine.createSpy();
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
