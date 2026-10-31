const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 240000,                       // 4 minutes per test (slow site)
  expect: { timeout: 15000 },            // checks wait up to 15 seconds
  retries: 1,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],   // report no longer blocks the terminal
  use: {
    storageState: 'playwright/.auth/user.json',
    viewport: { width: 1920, height: 1080 },
    navigationTimeout: 90000,            // opening a page can take 90 seconds
    actionTimeout: 30000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});