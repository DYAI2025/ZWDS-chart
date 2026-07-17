// Registers @testing-library/jest-dom matchers (e.g. toBeInTheDocument) on
// vitest's `expect`. The `/vitest` entrypoint extends the vitest expect
// directly, so it works even with `globals: false`.
import '@testing-library/jest-dom/vitest';

// jsdom does not implement matchMedia; components using prefers-reduced-motion /
// prefers-color-scheme hooks need it. Default every query to non-matching.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
    }) as unknown as MediaQueryList;
}
