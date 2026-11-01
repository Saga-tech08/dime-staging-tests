const { test, expect } = require('@playwright/test');
const { openSite, clickMenu, checkGridPage } = require('./helpers');

test('Page 1: My Submitted Invoices', async ({ page }) => {
  await openSite(page);
  await clickMenu(page, 'My Submitted Invoices');
  await checkGridPage(page, { menu: 'My Submitted Invoices' });

  await test.step('Row count text is shown at the bottom', async () => {
    // looks for text like "1 to 20 of 8,341"
    const paging = page
      .getByText(/\d[\d,]*\s*to\s*\d[\d,]*\s*of\s*\d[\d,]*/)
      .first();
    await paging.scrollIntoViewIfNeeded().catch(() => {});
    await expect.soft(paging).toBeVisible({ timeout: 20000 });
  });
});