import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { ResizableParts } from './resizable';

const flexGrow = (element: HTMLElement) => Number(element.style.flexGrow);

async function setup(onSizesCommit = vi.fn()) {
  const result = await render(
    `<ds-resizable data-testid="root" (sizesCommit)="onSizesCommit($event)">
       <ds-resizable-panel data-testid="files" [defaultSize]="30" [minSize]="20" [maxSize]="60" collapsible>
         Files
       </ds-resizable-panel>
       <ds-resizable-handle aria-label="Resize file list" withGrip />
       <ds-resizable-panel data-testid="editor">Editor</ds-resizable-panel>
     </ds-resizable>`,
    { imports: [...ResizableParts], componentProperties: { onSizesCommit } },
  );
  await settle(result.fixture);
  return { ...result, handle: screen.getByRole('separator'), onSizesCommit };
}

describe('Resizable', () => {
  it('splits the space and exposes a focusable separator', async () => {
    const { fixture, handle } = await setup();
    expect(flexGrow(screen.getByTestId('files'))).toBe(30);
    expect(flexGrow(screen.getByTestId('editor'))).toBe(70);
    expect(screen.getByTestId('root')).toHaveAttribute('data-orientation', 'horizontal');
    expect(handle).toHaveAccessibleName('Resize file list');
    expect(handle).toHaveAttribute('tabindex', '0');
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle).toHaveAttribute('aria-controls', screen.getByTestId('files').id);
    expect(handle).toHaveAttribute('aria-valuenow', '30');
    expect(handle).toHaveAttribute('aria-valuemin', '0');
    expect(handle).toHaveAttribute('aria-valuemax', '60');
    expect(handle.querySelector('.resizable-grip')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('files')).toHaveAttribute('data-state', 'expanded');
    expect(screen.getByTestId('editor')).not.toHaveAttribute('data-state');
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('resizes with the keyboard within the limits', async () => {
    const { fixture, handle, onSizesCommit } = await setup();
    handle.focus();
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    expect(onSizesCommit).toHaveBeenLastCalledWith([40, 60]);
    await userEvent.keyboard('{End}');
    await settle(fixture);
    expect(handle).toHaveAttribute('aria-valuenow', '60');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    await settle(fixture);
    // Arrow keys stop at the minimum instead of collapsing.
    expect(handle).toHaveAttribute('aria-valuenow', '20');
    expect(screen.getByTestId('files')).toHaveAttribute('data-state', 'expanded');
    await userEvent.keyboard('{Home}');
    await settle(fixture);
    // Home goes to the lowest value, which for a collapsible panel is collapsed.
    expect(handle).toHaveAttribute('aria-valuenow', '0');
  });

  it('collapses and restores a collapsible panel with Enter and double click', async () => {
    const { fixture, handle } = await setup();
    handle.focus();
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(screen.getByTestId('files')).toHaveAttribute('data-state', 'collapsed');
    expect(handle).toHaveAttribute('aria-valuenow', '0');
    await userEvent.keyboard('{Enter}');
    await settle(fixture);
    expect(screen.getByTestId('files')).toHaveAttribute('data-state', 'expanded');
    expect(handle).toHaveAttribute('aria-valuenow', '30');
    await userEvent.dblClick(handle);
    await settle(fixture);
    expect(screen.getByTestId('files')).toHaveAttribute('data-state', 'collapsed');
  });

  it('drags the handle relative to the group size', async () => {
    const { fixture, handle, onSizesCommit } = await setup();
    screen.getByTestId('root').getBoundingClientRect = () =>
      ({ width: 1000, height: 400, left: 0, top: 0 }) as DOMRect;
    fireEvent.pointerDown(handle, { button: 0, clientX: 300, pointerId: 1 });
    await settle(fixture);
    expect(handle).toHaveAttribute('data-dragging');
    expect(handle).toHaveFocus();
    fireEvent.pointerMove(handle, { clientX: 450, pointerId: 1 });
    await settle(fixture);
    expect(handle).toHaveAttribute('aria-valuenow', '45');
    // Dragged well below the minimum, a collapsible panel snaps shut.
    fireEvent.pointerMove(handle, { clientX: 50, pointerId: 1 });
    await settle(fixture);
    expect(handle).toHaveAttribute('aria-valuenow', '0');
    fireEvent.pointerUp(handle, { pointerId: 1 });
    await settle(fixture);
    expect(handle).not.toHaveAttribute('data-dragging');
    expect(onSizesCommit).toHaveBeenCalledWith([0, 100]);
  });

  it('stacks vertically, with ArrowDown growing the upper panel', async () => {
    const { fixture } = await render(
      `<ds-resizable orientation="vertical">
         <ds-resizable-panel [defaultSize]="50">Top</ds-resizable-panel>
         <ds-resizable-handle />
         <ds-resizable-panel>Bottom</ds-resizable-panel>
       </ds-resizable>`,
      { imports: [...ResizableParts] },
    );
    await settle(fixture);
    const handle = screen.getByRole('separator', { name: 'Resize' });
    expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
    expect(handle).toHaveAttribute('data-orientation', 'vertical');
    handle.focus();
    await userEvent.keyboard('{ArrowDown}');
    await settle(fixture);
    expect(handle).toHaveAttribute('aria-valuenow', '60');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await settle(fixture);
    expect(handle).toHaveAttribute('aria-valuenow', '40');
  });

  it('is controllable', async () => {
    const onSizesChange = vi.fn();
    const { fixture } = await render(
      `<ds-resizable [sizes]="sizes" (sizesChange)="onSizesChange($event)">
         <ds-resizable-panel>A</ds-resizable-panel>
         <ds-resizable-handle />
         <ds-resizable-panel>B</ds-resizable-panel>
       </ds-resizable>`,
      { imports: [...ResizableParts], componentProperties: { sizes: [50, 50], onSizesChange } },
    );
    await settle(fixture);
    screen.getByRole('separator').focus();
    await userEvent.keyboard('{ArrowLeft}');
    await settle(fixture);
    expect(onSizesChange).toHaveBeenCalledWith([40, 60]);
    // Controlled: nothing moves until the parent passes new sizes.
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '50');
  });

  it('follows two-way bound sizes', async () => {
    const { fixture } = await render(
      `<ds-resizable [(sizes)]="sizes">
         <ds-resizable-panel>A</ds-resizable-panel>
         <ds-resizable-handle />
         <ds-resizable-panel>B</ds-resizable-panel>
       </ds-resizable>`,
      { imports: [...ResizableParts], componentProperties: { sizes: [50, 50] } },
    );
    await settle(fixture);
    screen.getByRole('separator').focus();
    await userEvent.keyboard('{ArrowRight}');
    await settle(fixture);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '60');
    expect((fixture.componentInstance as unknown as { sizes: number[] }).sizes).toEqual([60, 40]);
  });

  it('does nothing while disabled', async () => {
    const { fixture } = await render(
      `<ds-resizable disabled>
         <ds-resizable-panel>A</ds-resizable-panel>
         <ds-resizable-handle />
         <ds-resizable-panel>B</ds-resizable-panel>
       </ds-resizable>`,
      { imports: [...ResizableParts] },
    );
    await settle(fixture);
    const handle = screen.getByRole('separator');
    expect(handle).not.toHaveAttribute('tabindex');
    expect(handle).toHaveAttribute('aria-disabled', 'true');
    expect(handle).toHaveAttribute('data-disabled', '');
    handle.focus();
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    fireEvent.pointerDown(handle, { button: 0, clientX: 0, pointerId: 1 });
    await settle(fixture);
    expect(handle).toHaveAttribute('aria-valuenow', '50');
    expect(handle).not.toHaveAttribute('data-dragging');
  });
});
