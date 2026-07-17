import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  // Cap parallelism: the axe a11y scans (esp. at 200% zoom) are CPU-heavy and starve each
  // other under high worker counts, causing non-deterministic 30s timeouts (Gate C flagged
  // that CI retries were masking this). 2 workers + test.slow() on the axe specs make the
  // suite deterministic. retries stay for genuine timing flakes, not to hide a real timeout.
  workers: 2,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], viewport: { width: 360, height: 800 } } },
  ],
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});