import { reflectComponentType, Type } from '@angular/core';
import * as padaDs from 'pada-ds-angular';

describe('pada-ds-angular public API', () => {
  const exported = Object.entries(padaDs as unknown as Record<string, unknown>);
  const components = exported.filter(([name]) => name.endsWith('Component')) as [
    string,
    Type<unknown>,
  ][];

  it('exports components', () => {
    expect(components.length).toBeGreaterThan(0);
  });

  it('gives every component a ds- element or a ds attribute selector', () => {
    for (const [name, component] of components) {
      const selector = reflectComponentType(component)?.selector ?? '';
      expect(selector, name).toMatch(/^ds-|\[ds[A-Z]/);
    }
  });
});
