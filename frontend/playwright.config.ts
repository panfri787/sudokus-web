import { defineConfig, devices } from '@playwright/test'

const mobile360 = {
  ...devices['Pixel 7'],
  viewport: { width: 360, height: 640 },
  hasTouch: true,
  isMobile: true,
}

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { trace: 'retain-on-failure' },
  // Las mediciones de rendimiento solo con `npm run test:perf` (un worker, sin contención).
  grepInvert: process.env.PERF ? undefined : /@perf/,
  grep: process.env.PERF ? /@perf/ : undefined,
  webServer: [
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run build && npm run preview -- --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
  projects: [
    {
      name: 'Pixel 7',
      use: { ...devices['Pixel 7'], baseURL: 'http://localhost:5173' },
      testIgnore: /(privacy|layout)\.spec\.ts/,
    },
    {
      name: 'iPhone 13',
      use: { ...devices['iPhone 13'], baseURL: 'http://localhost:5173' },
      testIgnore: /(privacy|layout)\.spec\.ts/,
    },
    {
      name: 'mobile-360',
      use: { ...mobile360, baseURL: 'http://localhost:5173' },
      testIgnore: /privacy\.spec\.ts/,
    },
    {
      name: 'build-360',
      use: { ...mobile360, baseURL: 'http://localhost:4173' },
      testMatch: /(privacy|layout)\.spec\.ts/,
    },
  ],
})
