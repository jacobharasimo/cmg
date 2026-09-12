import { defineConfig, devices } from '@playwright/test'

/**
 * Accessibility and end-to-end tests.
 *
 * These run against the production build in a real browser, because the
 * criteria that matter most here — focus not being obscured, computed target
 * sizes, whether a focus ring actually paints — need layout and paint. jsdom
 * has neither, which is why none of this lives in Vitest.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
