import { reflectComponentType, Type } from '@angular/core';
import * as padaDs from 'pada-ds';
import { BadgeComponent } from './components/badge/badge';

describe('pada-ds public API', () => {
  it('exports every moved ds-* component with its selector', () => {
    const selectors: Record<string, string> = {
      AvatarComponent: 'ds-avatar',
      BadgeComponent: 'ds-badge',
      ButtonComponent: 'ds-button',
      InfoIconComponent: 'ds-info-icon',
      InfoTooltipComponent: 'ds-info-tooltip',
    };
    const exported = padaDs as unknown as Record<string, Type<unknown>>;
    for (const [name, selector] of Object.entries(selectors)) {
      expect(reflectComponentType(exported[name])?.selector).toBe(selector);
    }
  });

  it('serves the library component through the old app path', () => {
    expect(BadgeComponent).toBe(padaDs.BadgeComponent);
  });
});
