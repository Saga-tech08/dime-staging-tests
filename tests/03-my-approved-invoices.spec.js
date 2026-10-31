const { test } = require('@playwright/test');
const { openSite, clickMenu, checkGridPage } = require('./helpers');

test('Page 3: My Approved Invoices', async ({ page }) => {
  await openSite(page);
  await clickMenu(page, 'My Approved Invoices');
  await checkGridPage(page, { menu: 'My Approved Invoices', expectStatus: 'Approved' });
});