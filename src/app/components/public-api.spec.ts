import { reflectComponentType } from '@angular/core';
import * as publicApi from './public-api';

describe('Design system public API', () => {
  it('exports exactly the four top-level components', () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      'AttributesComponent',
      'AvatarComponent',
      'BadgeComponent',
      'ButtonComponent',
    ]);
  });

  it('gives every exported component a ds- selector and a required data input', () => {
    for (const component of Object.values(publicApi)) {
      const mirror = reflectComponentType(component);
      expect(mirror?.selector).toMatch(/^ds-/);
      expect(mirror?.isStandalone).toBe(true);
      expect(mirror?.inputs.map((i) => i.propName)).toContain('data');
    }
  });
});
