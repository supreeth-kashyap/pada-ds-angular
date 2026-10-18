import { inject } from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';

/**
 * A unique, hydration-stable id (`ds-dialog-0`, `ds-dialog-1`, …). Call it in an injection
 * context: a field initializer or a constructor.
 */
export const uniqueId = (prefix: string): string => inject(_IdGenerator).getId(prefix);
