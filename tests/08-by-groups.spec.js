const { test } = require('@playwright/test');
const { openSite } = require('./helpers');
const { openReportingPage, checkReportingPage } = require('./reporting-helpers');

// VIEW ONLY: never opens the group dropdown and never clicks Export
test('Page 8: By Groups (REPORTING)', async ({ page }) => {
  await openSite(page);
  await openReportingPage(page, 'By Groups', 'Invoices By Group');
  await checkReportingPage(page, {
    menu: 'By Groups',
    heading: 'Invoices By Group',
    texts: ['SELECT A GROUP', /Select a group/],
    buttons: ['Export'],
    columns: ['ID', 'CONTRACTID', 'VENDOR NAME', 'PROJECT', 'INVOICE NO.', 'DESCRIPTION',
              'AMOUNT', 'SUBMITTED', 'START DATE', 'END DATE', 'FINANCIAL REVIEWER', 'STATUS'],
    emptyMessage: 'There are no Invoices to show here!',
  });
});