import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['dist/**','node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        window: 'readonly', document: 'readonly', navigator: 'readonly',
        requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
        ResizeObserver: 'readonly', URL: 'readonly', Blob: 'readonly',
        AbortSignal: 'readonly', DOMException: 'readonly', fetch: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-imports': ['error', { patterns: ['../../server/*','../server/*','server/*'] }],
    },
  },
  {
    files: ['server/**/*.mjs','scripts/**/*.mjs','tests/**/*.mjs'],
    languageOptions: { globals: { process: 'readonly', Buffer: 'readonly', fetch: 'readonly', URL: 'readonly', DOMException: 'readonly', structuredClone: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly' } },
    rules: { 'no-undef': 'error' },
  },
];