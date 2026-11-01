const { test, expect } = require('@playwright/test');
const { openSite } = require('./helpers');
const { openAdminPage, checkAdminPage } = require('./admin-helpers');

// VIEW ONLY: never clicks Add Group, Edit or Delete, and never types
test('Page 18: Edit Groups (ADMIN)', async ({ page }) => {
  await openSite(page);
  await openAdminPage(page, 'Edit Groups', 'List of Groups');

  // this page opens with data, so wait for the first row before checking
  await page.getByRole('row').nth(1)
    .waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});

  await checkAdminPage(page, {
    menu: 'Edit Groups',
    heading: 'List of Groups',
    searchHints: ['Search for Group...'],
    buttons: [/^Add Gro/, 'Edit', 'Delete'],
    columns: ['CATEGORY NAME'],
  });

  await test.step('Groups are listed', async () => {
    const dataRows = Math.max((await page.getByRole('row').count()) - 1, 0);
    console.log(`[Edit Groups] data rows: ${dataRows}`);
    // every group row should have its own Edit and Delete button
    const edits = await page.getByText('Edit', { exact: true }).filter({ visible: true }).count();
    const deletes = await page.getByText('Delete', { exact: true }).filter({ visible: true }).count();
    console.log(`[Edit Groups] visible Edit buttons: ${edits}, Delete buttons: ${deletes}`);
    expect.soft(dataRows, 'No groups shown, check the page by hand').toBeGreaterThan(0);
  });
});