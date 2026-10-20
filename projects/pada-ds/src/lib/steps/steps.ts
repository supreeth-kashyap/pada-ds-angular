import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { DsVisuallyHidden, uniqueId } from 'pada-ds-angular/headless';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from '../icon/icon';

export type StepStatus = 'upcoming' | 'current' | 'completed';
export type StepValue = number | string;

/** One step. */
export interface StepData {
  /** Title text. Steps without one are announced as "Step n". */
  title?: string;
  /** Supporting text, announced as the step's description. */
  description?: string;
  /** The step's value, reported when it is selected. @default its position, from 1 */
  stepValue?: StepValue;
  /** Status, unless the step is the current one. @default the `defaultStatus` */
  status?: StepStatus;
  /** Upcoming and completed steps are clickable unless this is `false`. */
  clickable?: boolean;
}

const STATUS_LABEL: Record<StepStatus, string> = {
  upcoming: 'not started',
  current: 'current step',
  completed: 'completed',
};

interface ResolvedStep {
  title: string | undefined;
  description: string | undefined;
  value: StepValue;
  status: StepStatus;
  interactive: boolean;
  statusLabel: string;
  descriptionId: string;
}

/**
 * A vertical list of steps (a checkout, an onboarding flow) with their status. The current step
 * has `aria-current="step"`; each step announces its status ("Plan (current step)"); upcoming
 * and completed steps are buttons that select them.
 *
 * ```html
 * <ds-steps [steps]="steps" [(currentStep)]="step" />
 * ```
 *
 * Without a current step (bound or clicked), each step shows its own `status`. Differences from
 * React: `currentStep` is a two-way `model` (React only calls `onStepChange` when it is
 * passed); per-step `onClick` is the `stepClick` output; the `Step` part is internal.
 */
@Component({
  selector: 'ds-steps',
  imports: [IconComponent, DsVisuallyHidden, NgTemplateOutlet],
  templateUrl: './steps.html',
  styleUrl: './steps.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'list' },
})
export class StepsComponent {
  /** The steps, in order. */
  readonly steps = input.required<StepData[]>();
  /** Status of steps that set none and are not current. @default 'upcoming' */
  readonly defaultStatus = input<StepStatus>('upcoming');
  /** The current step's value. Two-way bindable: `[(currentStep)]`. */
  readonly currentStep = model<StepValue | undefined>(undefined);
  /** A step was clicked (or activated with the keyboard), with its value. */
  readonly stepClick = output<StepValue>();

  private readonly baseId = uniqueId('ds-steps-');

  protected readonly resolved = computed<ResolvedStep[]>(() => {
    const current = this.currentStep();
    const fallback = this.defaultStatus();
    return this.steps().map((step, index) => {
      const value = step.stepValue ?? index + 1;
      let status: StepStatus;
      if (current === undefined) status = step.status ?? fallback;
      else if (current === value) status = 'current';
      else if (step.status && step.status !== 'current') status = step.status;
      else status = fallback;
      return {
        title: step.title,
        description: step.description,
        value,
        status,
        interactive: step.clickable !== false && status !== 'current',
        statusLabel: ` (${STATUS_LABEL[status]})`,
        descriptionId: `${this.baseId}-${index}-description`,
      };
    });
  });

  protected select(step: ResolvedStep) {
    if (!step.interactive) return;
    this.currentStep.set(step.value);
    this.stepClick.emit(step.value);
  }
}
