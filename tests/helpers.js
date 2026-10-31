const { expect } = require('@playwright/test');

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

module.exports = { openSite, clickMenu };