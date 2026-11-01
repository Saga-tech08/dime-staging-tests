const { test, expect } = require('@playwright/test');
const { openSite } = require('./helpers');
const { openAdminPage, checkAdminPage } = require('./admin-helpers');

// VIEW ONLY: never enters an invoice ID and never clicks Search or Export
test('Page 19: Revert Workflow (ADMIN)', async ({ page }) => {
  await openSite(page);
  await openAdminPage(page, 'Revert Workflow', 'Revert Workflow');

  await checkAdminPage(page, {
    menu: 'Revert Workflow',
    heading: 'Revert Workflow',
    texts: ['ENTER DIME ID', 'There are no Invoices to show here!'],
    buttons: ['Search', 'Export'],
    columns: ['CONTRACT', 'VENDOR NAME', 'INVOICE NO', 'DESCRIPTI', 'AMOUNT',
              'SUBMITTE', 'START DATE', 'END DATE', 'STATUS'],
  });

  await test.step('Grid opens empty (read only)', async () => {
    const dataRows = Math.max((await page.getByRole('row').count()) - 1, 0);
    console.log(`[Revert Workflow] data rows shown on this page: ${dataRows}`);
    // the page opens empty until an ID is searched, so rows here would be unexpected
    expect.soft(dataRows, 'The grid should open empty').toBe(0);
  });
});