const { test } = require('@playwright/test');
const { openSite, clickMenu, checkGridPage } = require('./helpers');

test('Page 3: My Approved Invoices', async ({ page }) => {
  await openSite(page);
  await clickMenu(page, 'My Approved Invoices');
  // TODO: ask the boss which statuses this page should show, then add, for example:
  // expectStatuses: ['Initial Review Complete', 'Revision Needed']
  await checkGridPage(page, { menu: 'My Approved Invoices' });
});