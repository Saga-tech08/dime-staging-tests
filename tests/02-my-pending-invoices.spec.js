const { test } = require('@playwright/test');
const { openSite, clickMenu, checkGridPage } = require('./helpers');

test('Page 2: My Pending Invoices', async ({ page }) => {
  await openSite(page);
  await clickMenu(page, 'My Pending Invoices');
  await checkGridPage(page, { menu: 'My Pending Invoices' });
});