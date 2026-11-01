const { test, expect } = require('@playwright/test');
const { openSite } = require('./helpers');
const { openAdminPage, checkAdminPage } = require('./admin-helpers');

// VIEW ONLY: never clicks into the user boxes, never types, never clicks Submit
test('Page 16: Change Reviewer (ADMIN)', async ({ page }) => {
  await openSite(page);
  await openAdminPage(page, 'Change Reviewer', 'Change Reviewer');

  await checkAdminPage(page, {
    menu: 'Change Reviewer',
    heading: 'Change Reviewer',
    texts: ['SELECT USER', 'REPLACE USER'],
    searchHints: ['Search for name...'],
    buttons: ['Submit'],
  });

  await test.step('Both user boxes are shown (read only)', async () => {
    const boxes = page.getByPlaceholder('Search for name...').filter({ visible: true });
    const count = await boxes.count();
    console.log(`[Change Reviewer] visible user search boxes: ${count} (expected 2)`);
    expect.soft(count, 'Expected the SELECT USER and REPLACE USER boxes').toBe(2);

    const submit = page.getByRole('button', { name: 'Submit' });
    if (await submit.count()) {
      console.log(`[Change Reviewer] Submit button greyed out: ${await submit.first().isDisabled()}`);
    } else {
      console.log('[Change Reviewer] Submit is not exposed as a button, so its state was not read');
    }
  });
});