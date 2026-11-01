const { test } = require('@playwright/test');
const { openSite, clickMenu, checkGridPage } = require('./helpers');

test('Page 2: My Pending Invoices', async ({ page }) => {
  await openSite(page);
  await clickMenu(page, 'My Pending Invoices');
  // TODO: ask the boss which statuses this page should show, then add
  // expectStatuses: ['...'] below
  await checkGridPage(page, { menu: 'My Pending Invoices' });
});