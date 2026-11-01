const { test, expect } = require('@playwright/test');

const HOME_URL =
  'https://ctgovexec.sharepoint.com/sites/DOT-DIME-Test/SitePages/Home.aspx';

// Statuses seen so far (most specific first)
const KNOWN_STATUSES = [
  'Initial Review Complete',
  'PE Review Complete',
  'Revision Needed',
  'Approved',
  'Rejected',
  'Submitted',
];

// Opens the site (retries up to 3 times) and waits until the app is ready
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

  // if the saved login expired, Microsoft sends us to its sign-in page
  await page.waitForTimeout(5000);
  if (/login\.microsoftonline\.com|login\.live\.com/.test(page.url())) {
    throw new Error(
      'LOGIN EXPIRED: the site sent us to the Microsoft sign-in page. ' +
      'Save a fresh login with: npx playwright codegen --save-storage=playwright/.auth/user.json "<site url>"'
    );
  }

  await expect(page.getByText('Home', { exact: true }).first())
    .toBeVisible({ timeout: 90000 });
  // wait for the first grid, so the app can respond to clicks
  await page.getByText('STATUS').first()
    .waitFor({ state: 'visible', timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(3000);
}

// Waits until the grid rows stay unchanged for 4 checks in a row (about 8 seconds).
// Returns true if the grid settled.
async function waitForGridToSettle(page) {
  const allRows = page.getByRole('row');
  await allRows.nth(1).waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});
  let previous = '';
  let stableChecks = 0;
  for (let i = 0; i < 40 && stableChecks < 4; i++) {
    await page.waitForTimeout(2000);
    const texts = await allRows.allInnerTexts();
    const snapshot = texts.slice(1).map(t => t.replace(/\s+/g, ' ').trim()).join('|');
    stableChecks = snapshot === previous ? stableChecks + 1 : 0;
    previous = snapshot;
  }
  return stableChecks >= 4;
}

// Clicks one item in the blue menu and makes sure the page really switched
// AND stayed switched (the app can flip back to its default list while loading).
// Some pages are slow, so it waits up to 60 seconds before clicking again.
// section = 'REPORTING' or 'ADMIN' for items inside those groups.
// heading = text expected in the white area (default: the menu name).
// grid    = false for pages that are not a grid (skips the grid settle wait).
async function clickMenu(page, name, section, heading, grid = true) {
  const expectedHeading = heading || name;
  const headingLocator = page.getByText(expectedHeading, { exact: true });

  for (let attempt = 1; attempt <= 3; attempt++) {
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

    // 1. did the page switch? (heading text appears twice: menu item + heading)
    const started = Date.now();
    const switched = await expect(headingLocator)
      .toHaveCount(2, { timeout: 60000 })
      .then(() => true)
      .catch(() => false);
    if (!switched) {
      console.log(`[${name}] click did not switch the page within 60 seconds (attempt ${attempt} of 3)`);
      continue;
    }
    console.log(`[${name}] page switched after about ${Math.round((Date.now() - started) / 1000)} seconds`);

    // 2. let the grid settle, then check the page did not flip back
    if (grid) await waitForGridToSettle(page);
    if ((await headingLocator.count()) === 2) return;
    console.log(`[${name}] page flipped back to the default view (attempt ${attempt} of 3)`);
  }

  console.log(`[${name}] WARNING: the page did not stay switched after 3 clicks`);
  await page.screenshot({
    path: `screenshots/${name.replace(/\W+/g, '-')}-switch-failed.png`,
    fullPage: true,
  });
}

// Checks one grid page after its menu item was clicked.
// expectStatuses (optional): list of statuses every row is allowed to have.
async function checkGridPage(page, { menu, title, expectStatuses }) {
  const heading = title || menu;
  const allRows = page.getByRole('row');   // header row + data rows
  let dataRowCount = 0;

  await test.step('Grid area has loaded', async () => {
    await expect(page.getByText('STATUS').first()).toBeVisible({ timeout: 90000 });
  });

  await test.step('Wait for the right page, then for the grid to settle', async () => {
    // make sure the page switched BEFORE reading any rows
    await expect(page.getByText(heading, { exact: true })).toHaveCount(2, { timeout: 60000 })
      .catch(() => console.log(`[${menu}] WARNING: heading "${heading}" not shown twice before reading rows`));
    const settled = await waitForGridToSettle(page);
    dataRowCount = Math.max((await allRows.count()) - 1, 0);
    console.log(`[${menu}] grid settled: ${settled}`);

    const texts = await allRows.allInnerTexts();
    texts.slice(1, 4).forEach((t, i) =>
      console.log(`[${menu}] row ${i + 1}: ${t.replace(/\s+/g, ' ').trim()}`)
    );
  });

  await test.step(`Heading "${heading}" shows in the white area`, async () => {
    // the text must appear twice: once in the blue menu and once as the page heading
    const matches = page.getByText(heading, { exact: true });
    console.log(`[${menu}] places where "${heading}" is shown: ${await matches.count()}`);
    await expect.soft(matches, `Heading "${heading}" missing in the white area`).toHaveCount(2);
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

  await test.step('Data rows and status summary', async () => {
    console.log(`[${menu}] data rows shown on this page: ${dataRowCount}`);
    if (dataRowCount === 0) {
      console.log(`[${menu}] WARNING: no data rows. Compare with the screenshot and the page by hand.`);
      test.info().annotations.push({
        type: 'warning',
        description: `${menu}: no data rows, grid content NOT verified`,
      });
      return;
    }

    const texts = (await allRows.allInnerTexts()).slice(1);
    const counts = {};
    const outsideAllowed = [];
    for (const t of texts) {
      const status = KNOWN_STATUSES.find(s => t.includes(s)) || 'OTHER';
      counts[status] = (counts[status] || 0) + 1;
      if (status === 'OTHER') {
        console.log(`[${menu}] UNKNOWN STATUS ROW: ${t.replace(/\s+/g, ' ').trim()}`);
      }
      if (expectStatuses && !expectStatuses.includes(status)) outsideAllowed.push(status);
    }
    console.log(`[${menu}] status summary: ${JSON.stringify(counts)}`);

    if (expectStatuses) {
      console.log(`[${menu}] allowed statuses: ${expectStatuses.join(', ')}`);
      expect.soft(
        outsideAllowed.length,
        `${outsideAllowed.length} row(s) have a status outside: ${expectStatuses.join(', ')}`
      ).toBe(0);
    } else {
      test.info().annotations.push({
        type: 'note',
        description: `${menu}: status rule not set yet, summary only: ${JSON.stringify(counts)}`,
      });
    }
  });

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