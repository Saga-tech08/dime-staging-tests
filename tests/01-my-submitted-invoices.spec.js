const { test, expect } = require('@playwright/test');
const { openSite, clickMenu } = require('./helpers');

test('Page 1: My Submitted Invoices', async ({ page }) => {

  await test.step('Open the site and click the menu item', async () => {
    await openSite(page);
    await clickMenu(page, 'My Submitted Invoices');
    // wait until the grid has loaded (Clone buttons appear)
    await expect(page.getByRole('button', { name: 'Clone' }).first())
      .toBeVisible({ timeout: 90000 });
  });

  await test.step('Heading shows in the white area', async () => {
    // the text appears twice (menu + heading), the heading is the last one
    await expect.soft(
      page.getByText('My Submitted Invoices', { exact: true }).last()
    ).toBeVisible();
  });

  await test.step('Search box, New Invoice and Export are shown', async () => {
    await expect.soft(page.getByPlaceholder('Search for an Invoice...')).toBeVisible();
    await expect.soft(page.getByText('New Invoice').first()).toBeVisible();
    await expect.soft(page.getByText('Export').first()).toBeVisible();
  });

  await test.step('Grid shows all column headers', async () => {
    await expect.soft(page.getByText('ID', { exact: true }).first()).toBeVisible();
    const columns = ['CONTRA', 'VENDOR', 'PROJECT', 'INVOICE', 'DESCRIPT',
                     'AMOUNT', 'SUBMITT', 'START DA', 'END DATE', 'STATUS'];
    for (const col of columns) {
      await expect.soft(page.getByText(col).first(), `Column ${col}`).toBeVisible();
    }
  });

  await test.step('Grid shows data rows with Clone buttons', async () => {
    const count = await page.getByRole('button', { name: 'Clone' }).count();
    console.log('Clone buttons (rows) found:', count);
    expect.soft(count).toBeGreaterThan(0);
  });

  await test.step('Row count text is shown at the bottom', async () => {
    // looks for text like "1 to 20 of 8,341"
    const paging = page
      .getByText(/\d[\d,]*\s*to\s*\d[\d,]*\s*of\s*\d[\d,]*/)
      .first();
    await paging.scrollIntoViewIfNeeded().catch(() => {});
    await expect.soft(paging).toBeVisible({ timeout: 20000 });
  });

  await test.step('No error messages on the page', async () => {
    await expect.soft(
      page.getByText(/something went wrong|failed to load|error/i)
    ).toHaveCount(0);
  });

  await test.step('Take a screenshot as evidence', async () => {
    await page.screenshot({
      path: 'screenshots/01-my-submitted-invoices.png',
      fullPage: true,
    });
  });
});