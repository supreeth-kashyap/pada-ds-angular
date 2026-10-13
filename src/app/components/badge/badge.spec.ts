import { TestBed } from '@angular/core/testing';
import { BadgeComponent, BadgeData } from './badge';

function setup(data: BadgeData) {
  const fixture = TestBed.createComponent(BadgeComponent);
  fixture.componentRef.setInput('data', data);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('BadgeComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [BadgeComponent] }));

  it('renders the label', () => {
    const el = setup({ label: 'New' });
    expect(el.querySelector('.badge__label')?.textContent?.trim()).toBe('New');
  });

  it('renders no empty icon slot', () => {
    const el = setup({ label: 'New' });
    expect(el.querySelector('.badge__icon')).toBeNull();
  });
});
