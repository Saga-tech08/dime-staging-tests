const { test } = require('@playwright/test');
const { openSite } = require('./helpers');
const { openReportingPage, checkReportingPage } = require('./reporting-helpers');

// VIEW ONLY: never types in the status box and never clicks Export
test('Page 10: By Status (REPORTING)', async ({ page }) => {
  await openSite(page);
  await openReportingPage(page, 'By Status', 'Invoices By Status');
  await checkReportingPage(page, {
    menu: 'By Status',
    heading: 'Invoices By Status',
    texts: ['SELECT A INVOICE STATUS', /Type 3 char to search/],
    buttons: ['Export'],
    columns: ['ID', 'CONTRACTID', 'VENDOR NAME', 'PROJECT', 'INVOICE NO.', 'DESCRIPTION',
              'AMOUNT', 'SUBMITTED', 'START DATE', 'END DATE', 'STATUS'],
    emptyMessage: 'There are no Invoices to show here!',
  });
});