import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const alias = { '@': path.resolve(__dirname, 'src') };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        // Existing node suite — pure logic tests. Only .test.ts / .test.mjs,
        // so the component .test.tsx files below are never picked up here.
        resolve: { alias },
        test: {
          name: 'node',
          environment: 'node',
          include: ['tests/**/*.test.ts', 'tests/**/*.test.mjs'],
          globals: false,
        },
      },
      {
        // React component-render stage — jsdom + real Testing Library.
        // Only .test.tsx under tests/component, so the node suite above is untouched.
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['tests/component/**/*.test.tsx'],
          setupFiles: ['./tests/component/setup.ts'],
          globals: false,
        },
      },
    ],
  },
});
