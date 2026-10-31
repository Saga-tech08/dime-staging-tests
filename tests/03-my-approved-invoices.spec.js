const { test } = require('@playwright/test');
const { openSite, clickMenu, checkGridPage } = require('./helpers');

test('Page 3: My Approved Invoices', async ({ page }) => {
  await openSite(page);
  await clickMenu(page, 'My Approved Invoices');
  // TODO: ask the boss which statuses this page should show, then add
  // expectStatuses: ['...'] here (for example ['Approved'] or ['Initial Review Complete'])
  await checkGridPage(page, { menu: 'My Approved Invoices' });
});