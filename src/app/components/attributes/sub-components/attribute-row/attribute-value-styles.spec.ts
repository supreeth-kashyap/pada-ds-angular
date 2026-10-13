import { TestBed } from '@angular/core/testing';
import { AttributeAvatarValueComponent } from './attribute-avatar-value';
import { AttributeTextValueComponent } from './attribute-text-value';

describe('Attribute value component styles', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [AttributeAvatarValueComponent, AttributeTextValueComponent] }),
  );

  it('lays out the avatar lockup as a flex row', () => {
    const fixture = TestBed.createComponent(AttributeAvatarValueComponent);
    fixture.componentInstance.data = { type: 'avatar', name: 'Anna Banks', initials: 'AB', subtitle: 'HR @company' };
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const lockup = el.querySelector('.attr-row__avatar-lockup') as HTMLElement;
    expect(getComputedStyle(lockup).display).toBe('flex');
    expect(getComputedStyle(lockup).flexDirection).toBe('row');
    expect(getComputedStyle(el.querySelector('.attr-row__avatar-info') as HTMLElement).flexDirection).toBe('column');
    expect(getComputedStyle(el.querySelector('.attr-row__avatar-name') as HTMLElement).fontWeight).toBe('700');
  });

  it('applies text value typography', () => {
    const fixture = TestBed.createComponent(AttributeTextValueComponent);
    fixture.componentInstance.data = { type: 'text', text: 'Active' };
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const text = el.querySelector('.attr-row__text') as HTMLElement;
    expect(getComputedStyle(text).fontSize).toBe('14px');
    expect(getComputedStyle(text).lineHeight).toBe('20px');
  });
});
