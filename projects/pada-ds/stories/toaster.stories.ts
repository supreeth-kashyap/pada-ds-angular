import { ChangeDetectionStrategy, Component, input, OnInit } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import {
  ButtonComponent,
  injectToast,
  ToasterComponent,
  type ToasterPosition,
} from 'pada-ds-angular';

/** Buttons that raise toasts, next to the Toaster that shows them. */
@Component({
  selector: 'app-toast-demo',
  imports: [ButtonComponent, ToasterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex; gap: 8px; flex-wrap: wrap">
      <button dsButton variant="secondary" (click)="toast({ title: 'Draft saved' })">
        Neutral
      </button>
      <button
        dsButton
        variant="secondary"
        (click)="toast.success({ title: 'Invite sent', description: 'ada@example.com' })"
      >
        Success
      </button>
      <button
        dsButton
        variant="secondary"
        (click)="toast.warning({ title: 'Storage almost full', description: '92% of 50 GB used.' })"
      >
        Warning
      </button>
      <button
        dsButton
        variant="secondary"
        (click)="toast.danger({ title: 'Payment failed', description: 'Check your card details.' })"
      >
        Danger
      </button>
      <button dsButton variant="secondary" (click)="archive()">With action</button>
    </div>
    <ds-toaster [position]="position()" />
  `,
})
class ToastDemoComponent implements OnInit {
  readonly position = input<ToasterPosition>('bottom-right');
  /** Toasts to raise on start, so the story shows the stack without a click. */
  readonly initial = input(false);
  protected readonly toast = injectToast();

  ngOnInit() {
    if (!this.initial()) return;
    this.toast.info({
      title: 'New version available',
      description: 'Reload to update.',
      duration: Infinity,
    });
    this.toast.success({ title: 'Report exported', duration: Infinity });
  }

  protected archive() {
    this.toast.success({
      title: 'Archived',
      action: { label: 'Undo', onClick: () => this.toast('Restored') },
    });
  }
}

const meta: Meta<ToastDemoComponent> = {
  title: 'Feedback/Toaster',
  component: ToastDemoComponent,
  argTypes: {
    position: {
      control: 'select',
      options: [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ],
    },
  },
  args: { position: 'bottom-right', initial: false },
};
export default meta;
type Story = StoryObj<ToastDemoComponent>;

export const Default: Story = {};
export const Stacked: Story = { args: { initial: true } };
export const TopCenter: Story = { args: { position: 'top-center', initial: true } };
