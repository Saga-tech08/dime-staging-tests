const { test } = require('@playwright/test');
const { openSite, clickMenu, checkGridPage } = require('./helpers');

test('Page 4: My Completed Invoices', async ({ page }) => {
  await openSite(page);
  await clickMenu(page, 'My Completed Invoices');
  // TODO: add expectStatuses once the boss confirms the rule
  await checkGridPage(page, { menu: 'My Completed Invoices' });
});