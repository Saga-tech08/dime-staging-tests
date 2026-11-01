const { test } = require('@playwright/test');
const { openSite } = require('./helpers');
const { openReportingPage, checkReportingPage } = require('./reporting-helpers');

// VIEW ONLY: never types in the vendor box and never clicks Export
test('Page 6: By Contracts (REPORTING)', async ({ page }) => {
  await openSite(page);
  await openReportingPage(page, 'By Contracts', 'Invoices By Contract');
  await checkReportingPage(page, {
    menu: 'By Contracts',
    heading: 'Invoices By Contract',
    texts: ['SELECT A VENDOR', 'SELECT A CONTRACT', /Type 3 char to search/],
    buttons: ['Export'],
    columns: ['ID', 'CONTRACTID', 'VENDOR NAME', 'PROJECT', 'INVOICE NO.', 'DESCRIPTION',
              'AMOUNT', 'SUBMITTED', 'START DATE', 'END DATE', 'STATUS'],
    emptyMessage: 'There are no Invoices to show here!',
  });
});