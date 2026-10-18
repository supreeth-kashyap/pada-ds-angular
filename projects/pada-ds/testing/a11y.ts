import axe from 'axe-core';

/**
 * Runs axe on an element and fails with a readable list of violations. Colour contrast is off:
 * jsdom does not compute styles, so it would only report false positives.
 *
 * ```ts
 * await expectNoA11yViolations(fixture.nativeElement);
 * ```
 */
export async function expectNoA11yViolations(element: Element) {
  const results = await axe.run(element, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  const violations = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help}\n  ${violation.nodes.map((node) => node.html).join('\n  ')}`,
  );
  expect(violations).toEqual([]);
}
