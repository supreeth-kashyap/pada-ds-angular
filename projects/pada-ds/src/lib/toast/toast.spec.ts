import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { injectToast, ToastService } from './toast.service';
import { ToasterComponent } from './toaster';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function setup(template = '<ds-toaster />') {
  const result = await render(template, { imports: [ToasterComponent] });
  const toast = TestBed.runInInjectionContext(() => injectToast());
  const service = TestBed.inject(ToastService);
  const flush = () => settle(result.fixture);
  return { ...result, toast, service, flush };
}

describe('Toast', () => {
  it('shows toasts in a labelled region as polite status messages', async () => {
    const { toast, flush, fixture } = await setup();
    toast.success({ title: 'Invite sent', description: 'ada@example.com' });
    await flush();
    expect(screen.getByRole('region', { name: 'Notifications (F8)' })).toBeInTheDocument();
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Invite sent');
    expect(status).toHaveTextContent('ada@example.com');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
    const item = status.closest('li')!;
    expect(item).toHaveAttribute('data-tone', 'success');
    expect(item).toHaveAttribute('data-state', 'open');
    expect(item).toHaveAttribute('data-front');
    // Button labels stay outside the live region.
    expect(status).not.toContainElement(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    );
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('errors are assertive alerts', async () => {
    const { toast, flush } = await setup();
    toast.danger('Upload failed');
    await flush();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Upload failed');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('closes after its duration, but not while hovered', async () => {
    const { toast, flush } = await setup();
    // Long enough for the render and the hover to finish before it runs out.
    toast({ title: 'Saved', duration: 250 });
    await flush();
    await userEvent.hover(screen.getByRole('status'));
    await flush();
    expect(screen.getByRole('status').closest('section')).toHaveAttribute('data-expanded');
    expect(screen.getByRole('status').closest('li')!.querySelector('.toast-timer')).toHaveAttribute(
      'data-paused',
    );
    await wait(350);
    await flush();
    expect(screen.getByRole('status')).toBeInTheDocument();
    await userEvent.unhover(screen.getByRole('status'));
    await flush();
    await wait(350);
    await flush();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('pauses while focus is in the stack', async () => {
    const { toast, flush } = await setup();
    toast({ title: 'Saved', duration: 250 });
    await flush();
    screen.getByRole('status').closest('li')!.focus();
    await flush();
    await wait(350);
    await flush();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('runs its action and closes; Escape and the close button dismiss', async () => {
    const onUndo = vi.fn();
    const onDismiss = vi.fn();
    const { toast, flush, service } = await setup();
    toast({
      title: 'Archived',
      duration: Infinity,
      action: { label: 'Undo', onClick: onUndo },
      onDismiss,
    });
    await flush();
    expect(screen.getByRole('status').closest('li')!.querySelector('.toast-timer')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await flush();
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).toBeNull();
    // Removed from the queue once it has animated out.
    expect(service.toasts()).toEqual([]);

    toast({ title: 'Second', duration: Infinity });
    await flush();
    await userEvent.keyboard('{F8}');
    expect(screen.getByRole('status').closest('li')).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await flush();
    expect(screen.queryByRole('status')).toBeNull();

    toast({ title: 'Third', duration: Infinity });
    await flush();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    await flush();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('dismisses on a sideways swipe past the threshold', async () => {
    const { toast, flush } = await setup();
    toast({ title: 'Saved', duration: Infinity });
    await flush();
    const item = screen.getByRole('status').closest('li')!;
    fireEvent.pointerDown(item, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(item, { clientX: 140, pointerId: 1 });
    await flush();
    expect(item).toHaveAttribute('data-swiping');
    expect(item.style.getPropertyValue('--pada-toast-swipe')).toBe('40px');
    fireEvent.pointerUp(item, { clientX: 140, pointerId: 1 });
    await flush();
    expect(item).not.toHaveAttribute('data-swiping');
    expect(screen.getByRole('status')).toBeInTheDocument();

    fireEvent.pointerDown(item, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(item, { clientX: 20, pointerId: 1 });
    fireEvent.pointerUp(item, { clientX: 20, pointerId: 1 });
    await flush();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('updates a toast in place when given the same id, or through update()', async () => {
    const { toast, flush } = await setup();
    toast({ id: 'upload', title: 'Uploading…', duration: Infinity });
    await flush();
    toast.success({ id: 'upload', title: 'Uploaded' });
    await flush();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Uploaded');
    expect(screen.getByRole('status').closest('li')).toHaveAttribute('data-tone', 'success');

    toast.update('upload', { description: '3 files' });
    await flush();
    expect(screen.getByRole('status')).toHaveTextContent('Uploaded3 files');
  });

  it('keeps only the newest toasts visible', async () => {
    const { toast, flush } = await setup('<ds-toaster [visibleToasts]="2" position="top-left" />');
    ['One', 'Two', 'Three'].forEach((title) => toast({ title, duration: Infinity }));
    await flush();
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.querySelector('.toast-title')?.textContent)).toEqual([
      'Three',
      'Two',
      'One',
    ]);
    expect(items[2]).toHaveAttribute('data-hidden');
    expect(items[1]).not.toHaveAttribute('data-hidden');
    expect(items[1].style.getPropertyValue('--pada-toast-index')).toBe('1');
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('data-vertical', 'top');
    expect(region).toHaveAttribute('data-horizontal', 'left');
  });

  it('dismisses everything without an id', async () => {
    const { toast, flush } = await setup();
    toast('One');
    toast('Two');
    await flush();
    toast.dismiss();
    await flush();
    expect(screen.queryAllByRole('status')).toHaveLength(0);
  });
});
