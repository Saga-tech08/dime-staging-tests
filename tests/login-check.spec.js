const { test, expect } = require('@playwright/test');

const HOME_URL =
  'https://ctgovexec.sharepoint.com/sites/DOT-DIME-Test/SitePages/Home.aspx';

test('saved login opens the DIME site', async ({ page }) => {
  await page.goto(HOME_URL);
  await expect(page).not.toHaveURL(/login\.microsoftonline\.com/);
  await expect(page).toHaveURL(/DOT-DIME-Test/);
  await page.screenshot({ path: 'screenshots/login-check.png', fullPage: true });
});