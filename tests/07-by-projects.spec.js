const { test } = require('@playwright/test');
const { openSite } = require('./helpers');
const { openReportingPage, checkReportingPage } = require('./reporting-helpers');

// VIEW ONLY: never types in the project box and never clicks Export
test('Page 7: By Projects (REPORTING)', async ({ page }) => {
  await openSite(page);
  await openReportingPage(page, 'By Projects', 'Invoices By Project');
  await checkReportingPage(page, {
    menu: 'By Projects',
    heading: 'Invoices By Project',
    texts: ['SELECT A PROJECT', /Type 3 char to search/],
    buttons: ['Export'],
    columns: ['ID', 'CONTRACTID', 'VENDOR NAME', 'PROJECT', 'INVOICE NO.', 'DESCRIPTION',
              'AMOUNT', 'SUBMITTED', 'START DATE', 'END DATE', 'STATUS'],
    emptyMessage: 'There are no Invoices to show here!',
  });
});
