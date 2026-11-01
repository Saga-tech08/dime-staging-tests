const { test, expect } = require('@playwright/test');
const { openSite } = require('./helpers');
const { openAdminPage, checkAdminPage } = require('./admin-helpers');

// VIEW ONLY: never clicks Add User, Edit or anything that changes data
test('Page 14: Add / Update User (ADMIN)', async ({ page }) => {
  await openSite(page);
  await openAdminPage(page, 'Add / Update User', 'List of Users');

  // this page opens with data, so wait for the first row before checking
  await page.getByRole('row').nth(1)
    .waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});

  await checkAdminPage(page, {
    menu: 'Add / Update User',
    heading: 'List of Users',
    searchHints: ['Search for a User/Role...'],
    buttons: ['Add User', 'Edit'],
    columns: ['NAME', 'EMAIL', 'VENDOR', 'ROLE', 'IS ACTIVE'],
  });

  await test.step('Users are listed', async () => {
    const rows = page.getByRole('row');
    const dataRows = Math.max((await rows.count()) - 1, 0);
    console.log(`[Add / Update User] data rows: ${dataRows}`);

    // role summary (counts only, no names or emails)
    const roles = ['Additional Reviewer', 'Global Reader', 'Contract Manager', 'Administrator',
      'Approver', 'Finance', 'Submitter'];
    const counts = {};
    for (const t of (await rows.allInnerTexts()).slice(1)) {
      const r = roles.find(x => t.includes(x)) || 'OTHER';
      counts[r] = (counts[r] || 0) + 1;
    }
    console.log(`[Add / Update User] role summary: ${JSON.stringify(counts)}`);

    expect.soft(dataRows, 'No users shown, check the page by hand').toBeGreaterThan(0);
  });
});