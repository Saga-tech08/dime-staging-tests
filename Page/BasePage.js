const { expect } = require('@playwright/test');
const urls = require('../config/env');
const { KNOWN_STATUSES } = require('../fixtures/TestData');

class BasePage {
  constructor(page) {
    this.page = page;
    this.allRows = page.getByRole('row');   // header row + data rows
  }

  // collapses extra spaces so text prints on one line
  clean(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  // first VISIBLE match of a locator
  visibleFirst(locator) {
    return locator.filter({ visible: true }).first();
  }

  // stops with a clear message if the saved login expired
  failIfLoginExpired() {
    if (/login\.microsoftonline\.com|login\.live\.com/.test(this.page.url())) {
      throw new Error(
        'LOGIN EXPIRED: the site sent us to the Microsoft sign-in page. Run: npm run login'
      );
    }
  }

  // opens the site (3 tries) and waits until the blue menu and the first grid are ready
  async openSite() {
    const page = this.page;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await page.goto(urls.DIME.uat, { waitUntil: 'domcontentloaded', timeout: 90000 });
        break;
      } catch (err) {
        console.log(`Open attempt ${attempt} failed: ${err.message.split('\n')[0]}`);
        if (attempt === 3) throw err;
        await page.waitForTimeout(5000);
      }
    }

    await page.waitForTimeout(5000);
    this.failIfLoginExpired();

    const home = page.getByText('Home', { exact: true }).first();
    const menuShown = await home.waitFor({ state: 'visible', timeout: 60000 })
      .then(() => true).catch(() => false);
    if (!menuShown) {
      console.log('The blue menu did not appear within 60 seconds, reloading the page once');
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {});
      await page.waitForTimeout(5000);
      this.failIfLoginExpired();
    }
    await expect(home).toBeVisible({ timeout: 90000 });

    // wait for the first data row of the opening grid, so the app can respond to clicks
    await this.allRows.nth(1).waitFor({ state: 'visible', timeout: 90000 }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  // waits until the grid rows stay unchanged for 4 checks in a row (about 8 seconds)
  async waitForGridToSettle() {
    await this.allRows.nth(1).waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});
    let previous = '';
    let stableChecks = 0;
    for (let i = 0; i < 40 && stableChecks < 4; i++) {
      await this.page.waitForTimeout(2000);
      const texts = await this.allRows.allInnerTexts();
      const snapshot = texts.slice(1).map(t => this.clean(t)).join('|');
      stableChecks = snapshot === previous ? stableChecks + 1 : 0;
      previous = snapshot;
    }
    return stableChecks >= 4;
  }

  // Clicks one item in the blue menu and makes sure the page switched AND stayed switched.
  // Attempt 1: click and wait. Attempt 2: click again WITHOUT reloading.
  // Attempt 3: reload the whole site, then click again.
  //   section     : 'REPORTING' or 'ADMIN' for items inside those groups
  //   heading     : text expected in the white area (default: the menu name)
  //   grid        : false for pages that are not a grid that opens with data
  //   waitSeconds : how long to wait for the page to switch per attempt
  async clickMenu(name, { section, heading, grid = true, waitSeconds = 90 } = {}) {
    const page = this.page;
    const expectedHeading = heading || name;
    const expectedCount = expectedHeading === name ? 2 : 1;   // menu item + heading
    const headingLocator = page.getByText(expectedHeading, { exact: true });

    for (let attempt = 1; attempt <= 3; attempt++) {
      if (attempt === 3) {
        console.log(`[${name}] reloading the site before the last attempt`);
        await this.openSite();
      } else if (attempt === 2) {
        console.log(`[${name}] clicking again without reloading (attempt 2 of 3)`);
      }

      if (section) {
        const firstItem = section === 'REPORTING' ? 'By Contracts' : 'Add / Update User';
        const visible = await page.getByText(firstItem, { exact: true }).first().isVisible();
        if (!visible) await page.getByText(section, { exact: true }).first().click();
      }
      const item = page.getByText(name, { exact: true }).first();
      await item.scrollIntoViewIfNeeded();
      await item.click();

      // 1. did the page switch?
      const started = Date.now();
      const switched = await expect(headingLocator)
        .toHaveCount(expectedCount, { timeout: waitSeconds * 1000 })
        .then(() => true).catch(() => false);
      if (!switched) {
        console.log(`[${name}] click did not switch the page within ${waitSeconds} seconds (attempt ${attempt} of 3)`);
        continue;
      }
      console.log(`[${name}] page switched after about ${Math.round((Date.now() - started) / 1000)} seconds (attempt ${attempt})`);

      // 2. let the content settle, then check the page did not flip back
      if (grid) await this.waitForGridToSettle();
      else await page.waitForTimeout(3000);
      if ((await headingLocator.count()) === expectedCount) return;
      console.log(`[${name}] page flipped back to the default view (attempt ${attempt} of 3)`);
    }

    console.log(`[${name}] WARNING: the page did not stay switched after 3 attempts`);
    await this.screenshot(`${name}-switch-failed`);
  }

  // the heading text appears twice when it equals the menu name (menu + heading), otherwise once
  async checkHeading(menu, heading) {
    const expectedCount = heading === menu ? 2 : 1;
    const matches = this.page.getByText(heading, { exact: true });
    console.log(`[${menu}] places where "${heading}" is shown: ${await matches.count()} (expected ${expectedCount})`);
    await expect.soft(matches, `Heading "${heading}" missing in the white area`)
      .toHaveCount(expectedCount);
  }

  // looks for real column headers first, because plain text such as "STATUS"
  // would also match the menu item "By Status"
  async checkColumns(menu, columns) {
    for (const col of columns) {
      const re = col === 'ID'
        ? /^\s*ID\s*$/i
        : new RegExp(col.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const header = this.page.getByRole('columnheader', { name: re });
      const viaRole = await header.count();
      if (viaRole === 0) {
        console.log(`[${menu}] note: no column header found by role for "${col}", using plain text`);
      }
      const target = viaRole > 0 ? header.first() : this.page.getByText(col).first();
      await expect.soft(target, `Column ${col}`).toBeVisible();
    }
  }

  // text inside the grid is data (for example an invoice description),
  // only a match OUTSIDE the grid counts as an error message
  async checkNoErrors(menu) {
    const errorRe = /something went wrong|failed to load|error/i;
    const found = await this.page.getByText(errorRe).evaluateAll(els => els.map(el => ({
      text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200),
      inGrid: !!el.closest('[role="row"], [role="gridcell"], tr, td'),
    })));
    found.forEach(f =>
      console.log(`[${menu}] text matching the error check (${f.inGrid ? 'inside the grid' : 'OUTSIDE the grid'}): ${f.text}`));
    const outside = found.filter(f => !f.inGrid);
    expect.soft(outside.length, `Error text shown on the page: ${outside.map(f => f.text).join(' | ')}`)
      .toBe(0);
  }

  // counts how many rows have each status
  async statusSummary(menu, { printUnknown = false } = {}) {
    const texts = (await this.allRows.allInnerTexts()).slice(1);
    const counts = {};
    const statuses = [];
    for (const t of texts) {
      const status = KNOWN_STATUSES.find(s => t.includes(s)) || 'OTHER';
      counts[status] = (counts[status] || 0) + 1;
      statuses.push(status);
      if (status === 'OTHER' && printUnknown) {
        console.log(`[${menu}] UNKNOWN STATUS ROW: ${this.clean(t)}`);
      }
    }
    console.log(`[${menu}] status summary: ${JSON.stringify(counts)}`);
    return { counts, statuses };
  }

  async screenshot(name) {
    await this.page.screenshot({
      path: `screenshots/${name.replace(/\W+/g, '-')}.png`,
      fullPage: true,
    });
  }
}

module.exports = { BasePage };