const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 420000,                       // 4 minutes per test (slow site)
  expect: { timeout: 15000 },            // checks wait up to 15 seconds
  retries: 0,                            // no hidden retries, so every result is the real one
  workers: 1,                            // one test at a time (shared staging data)
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    storageState: 'playwright/.auth/user.json',   // your saved login
    viewport: { width: 1920, height: 1080 },
    navigationTimeout: 90000,
    actionTimeout: 30000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});