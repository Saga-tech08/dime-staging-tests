const { test } = require('@playwright/test');
const { openSite } = require('./helpers');
const { openReportingPage, checkReportingPage } = require('./reporting-helpers');

// VIEW ONLY: never opens the user selector and never clicks Export
test('Page 9: By User (REPORTING)', async ({ page }) => {
  await openSite(page);
  await openReportingPage(page, 'By User', 'Pending Invoices By User');
  await checkReportingPage(page, {
    menu: 'By User',
    heading: 'Pending Invoices By User',
    texts: ['SELECT A USER'],
    buttons: ['Export'],
    columns: ['ID', 'CONTRACTID', 'VENDOR NAME', 'PROJECT', 'INVOICE NO.', 'DESCRIPTION',
              'AMOUNT', 'SUBMITTED', 'LATEST REVISION', 'START DATE', 'END DATE', 'STATUS',
              'PROJECT ENGINEER', 'PROJECT MANAGER', 'ADDITIONAL REVIEWER', 'FINANCE'],
    emptyMessage: 'There are no Invoices to show here!',
  });
});