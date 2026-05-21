import { TestBed } from '@angular/core/testing';
import { ButtonComponent, ButtonData } from './button';

function setup(data: ButtonData) {
  const fixture = TestBed.createComponent(ButtonComponent);
  fixture.componentInstance.data = data;
  fixture.detectChanges();
  return fixture;
}

describe('ButtonComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ButtonComponent] }));

  it('renders the label', () => {
    const { nativeElement } = setup({ label: 'Save' });
    expect(nativeElement.querySelector('button').textContent.trim()).toBe('Save');
  });

  it('is enabled by default', () => {
    const { nativeElement } = setup({ label: 'Save' });
    expect(nativeElement.querySelector('button').disabled).toBeFalse();
  });

  it('is disabled when data.disabled is true', () => {
    const { nativeElement } = setup({ label: 'Save', disabled: true });
    expect(nativeElement.querySelector('button').disabled).toBeTrue();
  });

  it('emits clicked on button click', () => {
    const { nativeElement, componentInstance } = setup({ label: 'Save' });
    const spy = jasmine.createSpy();
    componentInstance.clicked.subscribe(spy);
    nativeElement.querySelector('button').click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not emit clicked when disabled', () => {
    const { nativeElement, componentInstance } = setup({ label: 'Save', disabled: true });
    const spy = jasmine.createSpy();
    componentInstance.clicked.subscribe(spy);
    nativeElement.querySelector('button').click();
    expect(spy).not.toHaveBeenCalled();
  });
});
