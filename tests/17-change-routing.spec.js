const { test, expect } = require('@playwright/test');
const { openSite } = require('./helpers');
const { openAdminPage, checkAdminPage } = require('./admin-helpers');

// VIEW ONLY: never clicks New Routing or any row, never types, never prints names
test('Page 17: Change Routing (ADMIN)', async ({ page }) => {
  await openSite(page);
  await openAdminPage(page, 'Change Routing', 'List of Routings');

  // this page opens with data, so wait for the first row before checking
  await page.getByRole('row').nth(1)
    .waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});

  await checkAdminPage(page, {
    menu: 'Change Routing',
    heading: 'List of Routings',
    searchHints: ['Search for Contract or Project...'],
    buttons: [/^New Rout/],
    columns: ['CONTRACT NUMBER', 'PROJECT NUMBER', 'PROJECT MANAGER', 'PROJECT ENGINEER', 'FINANCE'],
  });

  await test.step('Routings are listed', async () => {
    const dataRows = Math.max((await page.getByRole('row').count()) - 1, 0);
    console.log(`[Change Routing] data rows: ${dataRows}`);
    expect.soft(dataRows, 'No routings shown, check the page by hand').toBeGreaterThan(0);
  });
});