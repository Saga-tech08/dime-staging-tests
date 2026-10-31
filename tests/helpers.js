const { test, expect } = require('@playwright/test');

const HOME_URL =
  'https://ctgovexec.sharepoint.com/sites/DOT-DIME-Test/SitePages/Home.aspx';

// Opens the site (retries up to 3 times) and waits for the blue menu
async function openSite(page) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(HOME_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
      break;
    } catch (err) {
      console.log(`Open attempt ${attempt} failed: ${err.message.split('\n')[0]}`);
      if (attempt === 3) throw err;
      await page.waitForTimeout(5000);
    }
  }
  await expect(page.getByText('Home', { exact: true }).first())
    .toBeVisible({ timeout: 90000 });
}

// Clicks one item in the blue menu.
// section = 'REPORTING' or 'ADMIN' for items inside those groups.
async function clickMenu(page, name, section) {
  if (section) {
    const firstItem = section === 'REPORTING' ? 'By Contracts' : 'Add / Update User';
    const visible = await page.getByText(firstItem, { exact: true }).first().isVisible();
    if (!visible) {
      await page.getByText(section, { exact: true }).first().click();
    }
  }
  const item = page.getByText(name, { exact: true }).first();
  await item.scrollIntoViewIfNeeded();
  await item.click();
}

// Checks one grid page after its menu item was clicked
async function checkGridPage(page, { menu, title, expectStatus }) {
  const heading = title || menu;
  const allRows = page.getByRole('row');   // header row + data rows
  let dataRowCount = 0;

  await test.step('Grid area has loaded', async () => {
    await expect(page.getByText('STATUS').first()).toBeVisible({ timeout: 90000 });
  });

  await test.step('Wait for data rows', async () => {
    // the 2nd row is the first data row (the 1st is the header)
    await allRows.nth(1).waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(2000);
    dataRowCount = Math.max((await allRows.count()) - 1, 0);
  });

  await test.step(`Heading "${heading}" shows in the white area`, async () => {
    await expect.soft(page.getByText(heading, { exact: true }).last()).toBeVisible();
  });

  await test.step('Search box, New Invoice and Export are shown', async () => {
    await expect.soft(page.getByPlaceholder('Search for an Invoice...')).toBeVisible();
    await expect.soft(page.getByText('New Invoice').first()).toBeVisible();
    await expect.soft(page.getByText('Export').first()).toBeVisible();
  });

  await test.step('Grid column headers', async () => {
    const columns = ['CONTRA', 'VENDOR', 'PROJECT', 'INVOICE', 'DESCRIPT',
                     'AMOUNT', 'SUBMITT', 'START DA', 'END DATE', 'STATUS'];
    for (const col of columns) {
      await expect.soft(page.getByText(col).first(), `Column ${col}`).toBeVisible();
    }
  });

  await test.step('Data rows', async () => {
    console.log(`[${menu}] data rows shown on this page: ${dataRowCount}`);
    if (dataRowCount === 0) {
      console.log(`[${menu}] WARNING: no data rows. Compare with the screenshot and the page by hand.`);
      test.info().annotations.push({
        type: 'warning',
        description: `${menu}: no data rows, grid content NOT verified`,
      });
    }
  });

  if (expectStatus) {
    if (dataRowCount > 0) {
      await test.step(`Every row shows status "${expectStatus}"`, async () => {
        const texts = await allRows.allInnerTexts();
        const dataTexts = texts.slice(1);   // skip the header row
        const wrong = dataTexts.filter(t => !t.includes(expectStatus));
        console.log(`[${menu}] rows with status "${expectStatus}": ${dataTexts.length - wrong.length} of ${dataTexts.length}`);
        expect.soft(wrong.length, `${wrong.length} row(s) do not show "${expectStatus}"`).toBe(0);
      });
    } else {
      console.log(`[${menu}] Status "${expectStatus}" NOT VERIFIED because there were no rows.`);
      test.info().annotations.push({
        type: 'warning',
        description: `${menu}: status "${expectStatus}" not verified (no rows)`,
      });
    }
  }

  await test.step('No error messages', async () => {
    await expect.soft(
      page.getByText(/something went wrong|failed to load|error/i)
    ).toHaveCount(0);
  });

  await test.step('Screenshot as evidence', async () => {
    await page.screenshot({
      path: `screenshots/${menu.replace(/\W+/g, '-')}.png`,
      fullPage: true,
    });
  });
}

module.exports = { openSite, clickMenu, checkGridPage };