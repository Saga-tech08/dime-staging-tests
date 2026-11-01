const { test, expect } = require('@playwright/test');
const { openSite } = require('./helpers');
const { openReportingPage, checkReportingPage } = require('./reporting-helpers');

// VIEW ONLY: never clicks Export or any row
test('Page 12: Unassigned Invoices (REPORTING)', async ({ page }) => {
  await openSite(page);
  await openReportingPage(page, 'Unassigned Invoices', 'Unassigned Invoices');

  // this page opens with data, so wait for the first row before checking
  await page.getByRole('row').nth(1)
    .waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});

  await checkReportingPage(page, {
    menu: 'Unassigned Invoices',
    heading: 'Unassigned Invoices',
    buttons: ['Export'],
    columns: ['ID', 'CONTRACTID', 'VENDOR NAME', 'PROJECT', 'INVOICE NO.', 'DESCRIPTION',
              'AMOUNT', 'SUBMITTED', 'START DATE', 'END DATE', 'GROUP', 'STATUS'],
  });

  await test.step('Rows are listed', async () => {
    const rows = page.getByRole('row');
    const dataRows = Math.max((await rows.count()) - 1, 0);
    console.log(`[Unassigned Invoices] data rows: ${dataRows}`);
    const texts = await rows.allInnerTexts();
    texts.slice(1, 4).forEach((t, i) =>
      console.log(`[Unassigned Invoices] row ${i + 1}: ${t.replace(/\s+/g, ' ').trim()}`));
    // 0 rows can be legitimate if every invoice has been assigned, so check by hand if it fails
    expect.soft(dataRows, 'No rows shown, check the page by hand').toBeGreaterThan(0);
  });
});