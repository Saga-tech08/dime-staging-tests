const { test } = require('@playwright/test');
const { openSite, clickMenu, checkGridPage } = require('./helpers');

test('Page 2: My Pending Invoices', async ({ page }) => {
  await openSite(page);
  // this page is slow to load, so it gets up to 150 seconds per attempt
  await clickMenu(page, 'My Pending Invoices', undefined, undefined, true, 150);
  // TODO: ask the boss which statuses this page should show, then add
  // expectStatuses: ['...'] below
  await checkGridPage(page, { menu: 'My Pending Invoices' });
});