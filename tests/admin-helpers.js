const { test, expect } = require('@playwright/test');

// Opens one ADMIN page from the blue menu and makes sure it really switched.
// heading = text shown in the white area. If it is the same as the menu name it
// appears twice (menu + heading), otherwise once.
// READ ONLY: it only clicks the menu item (and the ADMIN group header if collapsed).
async function openAdminPage(page, menu, heading) {
  const headingLocator = page.getByText(heading, { exact: true });
  const expectedCount = heading === menu ? 2 : 1;

  for (let attempt = 1; attempt <= 3; attempt++) {
    // open the ADMIN group if it is collapsed
    const firstItem = page.getByText('Add / Update User', { exact: true }).first();
    if (!(await firstItem.isVisible())) {
      await page.getByText('ADMIN', { exact: true }).first().click();
    }

    const item = page.getByText(menu, { exact: true }).first();
    await item.scrollIntoViewIfNeeded();
    await item.click();

    const started = Date.now();
    const switched = await expect(headingLocator)
      .toHaveCount(expectedCount, { timeout: 60000 })
      .then(() => true)
      .catch(() => false);
    if (!switched) {
      console.log(`[${menu}] click did not switch the page within 60 seconds (attempt ${attempt} of 3)`);
      continue;
    }
    console.log(`[${menu}] page switched after about ${Math.round((Date.now() - started) / 1000)} seconds`);

    await page.waitForTimeout(5000);   // let the page finish loading
    if ((await headingLocator.count()) === expectedCount) return true;
    console.log(`[${menu}] page flipped back to the default view (attempt ${attempt} of 3)`);
  }

  console.log(`[${menu}] WARNING: the page did not stay switched after 3 clicks`);
  await page.screenshot({
    path: `screenshots/${menu.replace(/\W+/g, '-')}-switch-failed.png`,
    fullPage: true,
  });
  return false;
}

// VIEW-ONLY checks for an ADMIN page. It never types and never clicks.
//   menu, heading : see above
//   texts         : labels shown on the page
//   searchHints   : hint of a search box; passes if it shows as a placeholder OR as text
//   buttons       : button texts (only checked as displayed, never clicked)
//   columns       : grid column headers
async function checkAdminPage(page, { menu, heading, texts = [], searchHints = [], buttons = [], columns = [] }) {
  const expectedCount = heading === menu ? 2 : 1;
  const visible = locator => locator.filter({ visible: true }).first();

  await test.step(`Heading "${heading}" shows in the white area`, async () => {
    const matches = page.getByText(heading, { exact: true });
    console.log(`[${menu}] places where "${heading}" is shown: ${await matches.count()} (expected ${expectedCount})`);
    await expect.soft(matches, `Heading "${heading}" missing in the white area`).toHaveCount(expectedCount);
  });

  await test.step('Labels are shown', async () => {
    for (const t of texts) {
      await expect.soft(visible(page.getByText(t)), `Text "${t}"`).toBeVisible();
    }
  });

  await test.step('Search boxes are shown', async () => {
    for (const h of searchHints) {
      const either = page.getByPlaceholder(h).or(page.getByText(h));
      await expect.soft(visible(either), `Search hint "${h}"`).toBeVisible();
    }
  });

  await test.step('Buttons are shown (not clicked)', async () => {
    for (const b of buttons) {
      const locator = page.getByText(b, { exact: true });
      console.log(`[${menu}] button "${b}" found ${await locator.count()} time(s)`);
      await expect.soft(visible(locator), `Button "${b}"`).toBeVisible();
    }
  });

  await test.step('Grid column headers', async () => {
    for (const col of columns) {
      const re = new RegExp(col.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      await expect.soft(page.getByRole('columnheader', { name: re }).first(), `Column ${col}`).toBeVisible();
    }
  });

  await test.step('No error messages', async () => {
    const errorRe = /something went wrong|failed to load|error/i;
    // find every piece of text that matches, and say whether it sits inside the grid data
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

module.exports = { openAdminPage, checkAdminPage };