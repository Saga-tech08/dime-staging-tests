const { test } = require('@playwright/test');
const { openSite, clickMenu, checkGridPage } = require('./helpers');

test('Page 5: All Pending Invoices', async ({ page }) => {
  await openSite(page);
  await clickMenu(page, 'All Pending Invoices');
  // TODO: add expectStatuses once the boss confirms the rule
  await checkGridPage(page, { menu: 'All Pending Invoices' });
});