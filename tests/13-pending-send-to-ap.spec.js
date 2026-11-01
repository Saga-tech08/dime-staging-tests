const { test, expect } = require('@playwright/test');
const { openSite } = require('./helpers');
const { openReportingPage, checkReportingPage } = require('./reporting-helpers');

// VIEW ONLY: never clicks Export or any row
test('Page 13: Pending Send to AP (REPORTING)', async ({ page }) => {
  await openSite(page);
  await openReportingPage(page, 'Pending Send to AP', 'Invoices to Send to AP');

  // this page opens with data, so wait for the first row before checking
  await page.getByRole('row').nth(1)
    .waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});

  await checkReportingPage(page, {
    menu: 'Pending Send to AP',
    heading: 'Invoices to Send to AP',
    buttons: ['Export'],
    columns: ['ID', 'CONTRACTID', 'VENDOR NAME', 'PROJECT', 'INVOICE NO.', 'DESCRIPTION',
              'AMOUNT', 'SUBMITTED', 'START DATE', 'END DATE', 'STATUS'],
  });

  await test.step('Rows are listed', async () => {
    const rows = page.getByRole('row');
    const dataRows = Math.max((await rows.count()) - 1, 0);
    console.log(`[Pending Send to AP] data rows: ${dataRows}`);
    const texts = (await rows.allInnerTexts()).slice(1);
    texts.slice(0, 3).forEach((t, i) =>
      console.log(`[Pending Send to AP] row ${i + 1}: ${t.replace(/\s+/g, ' ').trim()}`));

    // status summary, so you can show your boss what this page contains
    const statuses = ['Initial Review Complete', 'PE Review Complete', 'PM Review Complete',
      'Revision Submitted', 'Revision Needed', 'Approved', 'Rejected', 'Submitted'];
    const counts = {};
    for (const t of texts) {
      const s = statuses.find(x => t.includes(x)) || 'OTHER';
      counts[s] = (counts[s] || 0) + 1;
    }
    console.log(`[Pending Send to AP] status summary: ${JSON.stringify(counts)}`);

    // 0 rows can be legitimate if nothing is waiting, so check by hand if this fails
    expect.soft(dataRows, 'No rows shown, check the page by hand').toBeGreaterThan(0);
  });
});