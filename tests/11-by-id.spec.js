const { test } = require('@playwright/test');
const { openSite } = require('./helpers');
const { openReportingPage, checkReportingPage } = require('./reporting-helpers');

// VIEW ONLY: never types an ID and never clicks Search or Export
test('Page 11: By ID (REPORTING)', async ({ page }) => {
  await openSite(page);
  await openReportingPage(page, 'By ID', 'Find Invoice By ID');
  await checkReportingPage(page, {
    menu: 'By ID',
    heading: 'Find Invoice By ID',
    texts: ['ENTER DIME ID'],
    buttons: ['Search', 'Export'],
    columns: ['ID', 'CONTRACTID', 'VENDOR NAME', 'PROJECT', 'INVOICE NO.', 'DESCRIPTION',
              'AMOUNT', 'SUBMITTED', 'START DATE', 'END DATE', 'STATUS'],
    emptyMessage: 'There are no Invoices to show here!',
  });
});