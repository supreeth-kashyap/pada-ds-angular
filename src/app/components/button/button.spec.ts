import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ButtonComponent, ButtonData } from './button';

function setup(data: ButtonData) {
  const fixture = TestBed.createComponent(ButtonComponent);
  fixture.componentRef.setInput('data', data);
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
    expect(nativeElement.querySelector('button').disabled).toBe(false);
  });

  it('is disabled when data.disabled is true', () => {
    const { nativeElement } = setup({ label: 'Save', disabled: true });
    expect(nativeElement.querySelector('button').disabled).toBe(true);
  });

  it('emits clicked on button click', () => {
    const { nativeElement, componentInstance } = setup({ label: 'Save' });
    const spy = vi.fn();
    componentInstance.clicked.subscribe(spy);
    nativeElement.querySelector('button').click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not emit clicked when disabled', () => {
    const { nativeElement, componentInstance } = setup({ label: 'Save', disabled: true });
    const spy = vi.fn();
    componentInstance.clicked.subscribe(spy);
    nativeElement.querySelector('button').click();
    expect(spy).not.toHaveBeenCalled();
  });
});
