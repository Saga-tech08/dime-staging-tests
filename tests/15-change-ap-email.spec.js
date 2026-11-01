const { test, expect } = require('@playwright/test');
const { openSite } = require('./helpers');
const { openAdminPage, checkAdminPage } = require('./admin-helpers');

// VIEW ONLY: never types in the email field, never clicks Update,
// and never prints the email address
test('Page 15: Change AP Email (ADMIN)', async ({ page }) => {
  await openSite(page);
  await openAdminPage(page, 'Change AP Email', 'Change AP Email Address');

  await checkAdminPage(page, {
    menu: 'Change AP Email',
    heading: 'Change AP Email Address',
    texts: ['ACCOUNTS PAYABLE EMAIL ADDRESS'],
    buttons: ['Update'],
  });

  await test.step('Email field and Update button state (read only)', async () => {
    // does a visible input hold an email-looking value? (the value itself is NOT printed)
    const hasEmailValue = await page.locator('input').evaluateAll(els =>
      els.some(e => (e.offsetWidth || e.offsetHeight) && /@/.test(e.value)));
    console.log(`[Change AP Email] email field shows a value: ${hasEmailValue}`);

    const update = page.getByRole('button', { name: 'Update' });
    if (await update.count()) {
      console.log(`[Change AP Email] Update button greyed out: ${await update.first().isDisabled()}`);
    } else {
      console.log('[Change AP Email] Update is not exposed as a button, so its state was not read');
    }

    expect.soft(hasEmailValue, 'The email field looks empty, check the page by hand').toBe(true);
  });
});