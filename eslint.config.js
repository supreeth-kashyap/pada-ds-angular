// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: ['ds', 'app'], style: 'camelCase' },
      ],
      // Elements are kebab-case (ds-dialog); attribute components on native elements are
      // camelCase like directives (button[dsButton]).
      '@angular-eslint/component-selector': [
        'error',
        [
          { type: 'element', prefix: ['ds', 'app'], style: 'kebab-case' },
          { type: 'attribute', prefix: ['ds', 'app'], style: 'camelCase' },
        ],
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/no-output-native': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
  {
    // Labels in the library get their `for` from dsFieldLabel's host binding, which the rule
    // cannot see. The Field tests check the association instead.
    files: ['projects/pada-ds/**/*.html', 'projects/pada-ds/**/*.ts'],
    rules: { '@angular-eslint/template/label-has-associated-control': 'off' },
  },
);
