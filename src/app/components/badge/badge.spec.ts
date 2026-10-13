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

  it('hides icon slot when icon is not provided', () => {
    const el = setup({ label: 'New' });
    expect(el.querySelector('.badge__icon')).toBeNull();
  });

  it('shows icon slot when icon is provided', () => {
    const el = setup({ label: 'New', icon: 'columns-3-cog' });
    expect(el.querySelector('.badge__icon')).not.toBeNull();
  });
});
