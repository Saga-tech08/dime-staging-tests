const { test, expect } = require('@playwright/test');

const HOME_URL =
  'https://ctgovexec.sharepoint.com/sites/DOT-DIME-Test/SitePages/Home.aspx';

// Statuses seen so far (most specific first)
const KNOWN_STATUSES = [
  'Initial Review Complete',
  'PE Review Complete',
  'PM Review Complete',
  'Revision Submitted',
  'Revision Needed',
  'Approved',
  'Rejected',
  'Submitted',
];

// Stops with a clear message if the saved login expired
function failIfLoginExpired(page) {
  if (/login\.microsoftonline\.com|login\.live\.com/.test(page.url())) {
    throw new Error(
      'LOGIN EXPIRED: the site sent us to the Microsoft sign-in page. ' +
      'Save a fresh login with: npx playwright codegen --save-storage=playwright/.auth/user.json "<site url>"'
    );
  }
}

// Opens the site (retries up to 3 times) and waits until the app is ready.
// If the menu does not appear, it reloads the page once.
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

  await page.waitForTimeout(5000);
  failIfLoginExpired(page);

  const home = page.getByText('Home', { exact: true }).first();
  const menuShown = await home.waitFor({ state: 'visible', timeout: 60000 })
    .then(() => true).catch(() => false);
  if (!menuShown) {
    console.log('The blue menu did not appear within 60 seconds, reloading the page once');
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {});
    await page.waitForTimeout(5000);
    failIfLoginExpired(page);
  }
  await expect(home).toBeVisible({ timeout: 90000 });

  // wait for the first data row of the opening grid, so the app can respond to clicks
  await page.getByRole('row').nth(1)
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

// Checks that column headers exist. It looks for real column headers first,
// because plain text such as "STATUS" would also match the menu item "By Status".
async function checkColumns(page, menu, columns) {
  for (const col of columns) {
    const header = page.getByRole('columnheader', { name: new RegExp(col, 'i') });
    const viaRole = await header.count();
    if (viaRole === 0) {
      console.log(`[${menu}] note: no column header found by role for "${col}", using plain text (could also match the menu)`);
    }
    const target = viaRole > 0 ? header.first() : page.getByText(col).first();
    await expect.soft(target, `Column ${col}`).toBeVisible();
  }
}

// Clicks one item in the blue menu and makes sure the page really switched
// AND stayed switched (the app can flip back to its default list while loading).
// Attempt 1: click and wait. Attempt 2: click again WITHOUT reloading (a slow page may
// still be loading). Attempt 3: reload the whole site, then click again.
// section     = 'REPORTING' or 'ADMIN' for items inside those groups.
// heading     = text expected in the white area (default: the menu name).
// grid        = false for pages that are not a grid (skips the grid settle wait).
// waitSeconds = how long to wait for the page to switch per attempt (default 90).
async function clickMenu(page, name, section, heading, grid = true, waitSeconds = 90) {
  const expectedHeading = heading || name;
  const expectedCount = expectedHeading === name ? 2 : 1;
  const headingLocator = page.getByText(expectedHeading, { exact: true });

  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt === 3) {
      console.log(`[${name}] reloading the site before the last attempt`);
      await openSite(page);
    } else if (attempt === 2) {
      console.log(`[${name}] clicking again without reloading (attempt 2 of 3)`);
    }

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

    // 1. did the page switch?
    const started = Date.now();
    const switched = await expect(headingLocator)
      .toHaveCount(expectedCount, { timeout: waitSeconds * 1000 })
      .then(() => true)
      .catch(() => false);
    if (!switched) {
      console.log(`[${name}] click did not switch the page within ${waitSeconds} seconds (attempt ${attempt} of 3)`);
      continue;
    }
    console.log(`[${name}] page switched after about ${Math.round((Date.now() - started) / 1000)} seconds (attempt ${attempt})`);

    // 2. let the content settle, then check the page did not flip back
    if (grid) {
      await waitForGridToSettle(page);
    } else {
      await page.waitForTimeout(3000);
    }
    if ((await headingLocator.count()) === expectedCount) return;
    console.log(`[${name}] page flipped back to the default view (attempt ${attempt} of 3)`);
  }

  console.log(`[${name}] WARNING: the page did not stay switched after 3 attempts`);
  await page.screenshot({
    path: `screenshots/${name.replace(/\W+/g, '-')}-switch-failed.png`,
    fullPage: true,
  });
}

// Checks one invoice grid page after its menu item was clicked.
// expectStatuses (optional): list of statuses every row is allowed to have.
async function checkGridPage(page, { menu, title, expectStatuses }) {
  const heading = title || menu;
  const allRows = page.getByRole('row');   // header row + data rows
  let dataRowCount = 0;

  await test.step('Grid area has loaded', async () => {
    await allRows.nth(1).waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});
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
    await checkColumns(page, menu, ['CONTRA', 'VENDOR', 'PROJECT', 'INVOICE', 'DESCRIPT',
                                    'AMOUNT', 'SUBMITT', 'START DA', 'END DATE', 'STATUS']);
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
    const errorRe = /something went wrong|failed to load|error/i;
    // text inside the grid is invoice data (for example a description), only a match outside is an error message
    const found = await page.getByText(errorRe).evaluateAll(els => els.map(el => ({
      text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200),
      inGrid: !!el.closest('[role="row"], [role="gridcell"], tr, td'),
    })));
    found.forEach(f =>
      console.log(`[${menu}] text matching the error check (${f.inGrid ? 'inside the grid' : 'OUTSIDE the grid'}): ${f.text}`));
    const outside = found.filter(f => !f.inGrid);
    expect.soft(outside.length, `Error text shown on the page: ${outside.map(f => f.text).join(' | ')}`).toBe(0);
  });

  await test.step('Screenshot as evidence', async () => {
    await page.screenshot({
      path: `screenshots/${menu.replace(/\W+/g, '-')}.png`,
      fullPage: true,
    });
  });
}

module.exports = { openSite, clickMenu, checkGridPage };