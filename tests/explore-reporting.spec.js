const { test } = require('@playwright/test');
const { openSite } = require('./helpers');

// The REPORTING page to look at
const MENU = 'By Groups';

// READ ONLY: clicks only the menu item, never types and never clicks buttons
test(`Explore REPORTING page: ${MENU}`, async ({ page }) => {
  await openSite(page);

  // open the REPORTING group if it is collapsed
  const firstItem = page.getByText('By Contracts', { exact: true }).first();
  if (!(await firstItem.isVisible())) {
    await page.getByText('REPORTING', { exact: true }).first().click();
  }

  const item = page.getByText(MENU, { exact: true }).first();
  await item.scrollIntoViewIfNeeded();
  await item.click();
  await page.waitForTimeout(45000);   // give the slow site time to load

  const clean = arr => arr.map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean);

  console.log(`\n===== ${MENU} =====`);
  console.log('Times the menu text appears:', await page.getByText(MENU, { exact: true }).count());
  console.log('Headings:', clean(await page.getByRole('heading').allInnerTexts()));
  console.log('Search or input hints:',
    await page.locator('input[placeholder]').evaluateAll(els => els.map(e => e.placeholder)));
  console.log('Buttons:', clean(await page.getByRole('button').allInnerTexts()));
  console.log('Column headers:', clean(await page.getByRole('columnheader').allInnerTexts()));

  const rows = page.getByRole('row');
  const rowCount = await rows.count();
  console.log('Table rows (including header):', rowCount);
  const rowTexts = clean(await rows.allInnerTexts());
  rowTexts.slice(1, 4).forEach((t, i) => console.log(`Row ${i + 1}:`, t));

  // all visible text, minus the blue menu
  const menuWords = ['Home', 'My Submitted Invoices', 'My Pending Invoices', 'My Approved Invoices',
    'My Completed Invoices', 'All Pending Invoices', 'REPORTING', 'By Contracts', 'By Projects',
    'By Groups', 'By User', 'By Status', 'By ID', 'Unassigned Invoices', 'Pending Send to AP',
    'ADMIN', 'Add / Update User', 'Change AP Email', 'Change Reviewer', 'Change Routing',
    'Edit Groups', 'Revert Workflow'];
  const lines = clean((await page.locator('body').innerText()).split('\n'))
    .filter(l => !menuWords.includes(l));
  console.log('Other text on the page (first 40 lines):');
  lines.slice(0, 40).forEach(l => console.log('  ', l));

  await page.screenshot({ path: `screenshots/explore-${MENU.replace(/\W+/g, '-')}.png`, fullPage: true });
});