// Registers @testing-library/jest-dom matchers (e.g. toBeInTheDocument) on
// vitest's `expect`. The `/vitest` entrypoint extends the vitest expect
// directly, so it works even with `globals: false`.
import '@testing-library/jest-dom/vitest';
