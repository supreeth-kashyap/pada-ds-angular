import { TestBed } from '@angular/core/testing';
import { InfoTooltipComponent, InfoTooltipData } from './info-tooltip';

function setup(data: InfoTooltipData = { label: 'Status', text: 'Current state' }) {
  const fixture = TestBed.createComponent(InfoTooltipComponent);
  fixture.componentRef.setInput('data', data);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    el,
    trigger: el.querySelector('button') as HTMLButtonElement,
    popup: el.querySelector('[role="tooltip"]') as HTMLElement,
  };
}

describe('InfoTooltipComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [InfoTooltipComponent] }));

  it('renders a native button trigger reachable by Tab', () => {
    const { trigger } = setup();
    expect(trigger.getAttribute('type')).toBe('button');
    expect(trigger.disabled).toBe(false);
    expect(trigger.tabIndex).toBe(0);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
  });

  it('gives the trigger an accessible name from the label', () => {
    const { trigger } = setup({ label: 'Status', text: 'Current state' });
    expect(trigger.getAttribute('aria-label')).toBe('More info about Status');
  });

  it('links the trigger to the tooltip with aria-describedby', () => {
    const { trigger, popup } = setup();
    expect(popup.id).not.toBe('');
    expect(trigger.getAttribute('aria-describedby')).toBe(popup.id);
  });

  it('gives each instance a unique tooltip id', () => {
    const first = setup();
    const second = setup();
    expect(first.popup.id).not.toBe(second.popup.id);
  });

  it('hides the tooltip text until interaction', () => {
    const { popup } = setup();
    expect(popup.hidden).toBe(true);
  });

  it('shows the tooltip text on focus and hides it on blur', () => {
    const { fixture, trigger, popup } = setup({ label: 'Status', text: 'Current state' });
    trigger.focus();
    fixture.detectChanges();
    expect(popup.hidden).toBe(false);
    expect(popup.textContent?.trim()).toBe('Current state');
    trigger.blur();
    fixture.detectChanges();
    expect(popup.hidden).toBe(true);
  });

  it('shows the tooltip text on hover', () => {
    const { fixture, el, popup } = setup();
    el.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(popup.hidden).toBe(false);
    el.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(popup.hidden).toBe(true);
  });

  it('closes on Escape and reopens on the next focus', () => {
    const { fixture, trigger, popup } = setup();
    trigger.focus();
    fixture.detectChanges();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(popup.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    trigger.blur();
    trigger.focus();
    fixture.detectChanges();
    expect(popup.hidden).toBe(false);
  });
});
