import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { settle } from '../../../testing/settle';
import { UploadedFile, UploadFieldComponent, UploadViewEvent } from './upload-field';

// The visually hidden file input has `pointer-events: none` (clicks go through the drop zone).
const upload = (input: HTMLElement, files: File | File[]) =>
  userEvent.setup({ pointerEventsCheck: 0 }).upload(input, files);

const file = (name: string, size = 10) =>
  new File(['x'.repeat(size)], name, { type: 'text/plain' });

describe('UploadFieldComponent', () => {
  it('is a labelled, described file input that keyboard users can reach', async () => {
    const { fixture } = await render(
      `<ds-upload-field label="Evidence" description="Attach the signed policy." accept=".pdf" [maxSize]="1024" />`,
      { imports: [UploadFieldComponent] },
    );
    await settle(fixture);
    const input = screen.getByLabelText('Evidence');
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAccessibleDescription(
      'Attach the signed policy. Supported type(s): .pdf Max size: 1 KB',
    );
    await userEvent.tab();
    expect(input).toHaveFocus();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('lists picked files and flags ones over the size limit', async () => {
    const { fixture } = await render(
      `<ds-upload-field label="Evidence" multiple [maxSize]="5" [(files)]="files" />`,
      { imports: [UploadFieldComponent], componentProperties: { files: [] as UploadedFile[] } },
    );
    await upload(screen.getByLabelText('Evidence'), [file('small.txt', 2), file('big.txt', 50)]);
    await settle(fixture);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[1]).toHaveAttribute('data-status', 'error');
    expect(items[1]).toHaveTextContent('File size exceeds 5 Bytes');
    await userEvent.click(screen.getByRole('button', { name: 'Remove big.txt' }));
    await settle(fixture);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(
      (fixture.componentInstance as unknown as { files: UploadedFile[] }).files.map(
        (entry) => entry.file.name,
      ),
    ).toEqual(['small.txt']);
  });

  it('marks uploaded files successful, or failed with the message', async () => {
    let fail = false;
    const uploader = async () => {
      if (fail) throw new Error('Server said no');
    };
    const { fixture } = await render(`<ds-upload-field label="Evidence" [upload]="uploader" />`, {
      imports: [UploadFieldComponent],
      componentProperties: { uploader },
    });
    const input = screen.getByLabelText('Evidence');
    await upload(input, file('ok.txt'));
    await settle(fixture);
    expect(screen.getByRole('listitem')).toHaveAttribute('data-status', 'success');
    fail = true;
    await upload(input, file('nope.txt'));
    await settle(fixture);
    // Single mode replaces the list.
    expect(screen.getByRole('listitem')).toHaveAttribute('data-status', 'error');
    expect(screen.getByRole('listitem')).toHaveTextContent('Server said no');
  });

  it('shows progress, emits view, and opens the file unless prevented', async () => {
    const files: UploadedFile[] = [{ id: '1', file: file('report.txt'), progress: 40 }];
    const views: UploadViewEvent[] = [];
    let prevent = true;
    const onView = (event: UploadViewEvent) => {
      views.push(event);
      if (prevent) event.preventDefault();
    };
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const url = URL as unknown as Record<string, unknown>;
    const created = vi.fn(() => 'blob:report');
    url['createObjectURL'] = created;
    url['revokeObjectURL'] = vi.fn();
    const { fixture } = await render(
      `<ds-upload-field label="Evidence" [files]="files" (view)="onView($event)" />`,
      { imports: [UploadFieldComponent], componentProperties: { files, onView } },
    );
    await settle(fixture);
    expect(screen.getByRole('progressbar', { name: 'Uploading report.txt' })).toHaveAttribute(
      'aria-valuenow',
      '40',
    );
    await userEvent.click(screen.getByRole('button', { name: 'View report.txt' }));
    expect(views[0].file).toBe(files[0]);
    expect(open).not.toHaveBeenCalled();

    prevent = false;
    await userEvent.click(screen.getByRole('button', { name: 'View report.txt' }));
    expect(created).toHaveBeenCalledWith(files[0].file);
    expect(open).toHaveBeenCalledWith('blob:report', '_blank', 'noopener');
    open.mockRestore();
    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('shows the error instead of the description and works with reactive forms', async () => {
    const control = new FormControl<UploadedFile[]>([]);
    const { fixture } = await render(
      `<ds-upload-field label="Evidence" description="PDF only." error="Attach a file." [formControl]="control" />
       <ds-upload-field label="Other" description="Any file." error="Too many files." />`,
      { imports: [UploadFieldComponent, ReactiveFormsModule], componentProperties: { control } },
    );
    await settle(fixture);
    const other = screen.getByLabelText('Other');
    expect(other).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Too many files.');
    expect(screen.queryByText('Any file.')).toBeNull();

    const input = screen.getByLabelText('Evidence');
    expect(input).not.toHaveAttribute('aria-invalid');
    await upload(input, file('a.pdf'));
    await settle(fixture);
    expect(control.value?.map((entry) => entry.file.name)).toEqual(['a.pdf']);
    expect(control.touched).toBe(true);
    control.setValue([]);
    await settle(fixture);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    control.disable();
    await settle(fixture);
    expect(input).toBeDisabled();
  });
});
