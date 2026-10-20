/** `data-state` of a progress indicator, as Radix and React's Progress parts expose it. */
export type ProgressState = 'indeterminate' | 'loading' | 'complete';

/** `value` as a percentage of `max`, clamped to 0–100; null while indeterminate. */
export function progressPercentage(value: number | null | undefined, max: number): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return Math.min(100, Math.max(0, percentage));
}

export function progressState(percentage: number | null): ProgressState {
  if (percentage === null) return 'indeterminate';
  return percentage >= 100 ? 'complete' : 'loading';
}
