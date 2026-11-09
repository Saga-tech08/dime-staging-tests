const { test, expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const { INVOICE_COLUMNS } = require('../fixtures/TestData');

// Shared checks for the pages that list invoices
class InvoiceListPage extends BasePage {
  constructor(page, { menu, waitSeconds = 90 }) {
    super(page);
    this.menu = menu;
    this.heading = menu;   // on these pages the heading equals the menu name
    this.waitSeconds = waitSeconds;
  }

  async open() {
    await this.clickMenu(this.menu, { waitSeconds: this.waitSeconds });
  }

  // expectStatuses (optional): the statuses every row is allowed to have.
  // Leave it out until your manager confirms the rule for the page.
  async verify({ expectStatuses } = {}) {
    const { page, menu } = this;
    let dataRowCount = 0;

    await test.step('Wait for the right page, then for the grid to settle', async () => {
      await expect(page.getByText(this.heading, { exact: true })).toHaveCount(2, { timeout: 60000 })
        .catch(() => console.log(`[${menu}] WARNING: heading "${this.heading}" not shown twice before reading rows`));
      const settled = await this.waitForGridToSettle();
      dataRowCount = Math.max((await this.allRows.count()) - 1, 0);
      console.log(`[${menu}] grid settled: ${settled}`);
      const texts = await this.allRows.allInnerTexts();
      texts.slice(1, 4).forEach((t, i) => console.log(`[${menu}] row ${i + 1}: ${this.clean(t)}`));
    });

    await test.step(`Heading "${this.heading}" shows in the white area`, async () => {
      await this.checkHeading(menu, this.heading);
    });

    await test.step('Search box, New Invoice and Export are shown', async () => {
      await expect.soft(page.getByPlaceholder('Search for an Invoice...')).toBeVisible();
      await expect.soft(page.getByText('New Invoice').first()).toBeVisible();
      await expect.soft(page.getByText('Export').first()).toBeVisible();
    });

    await test.step('Grid column headers', async () => {
      await this.checkColumns(menu, INVOICE_COLUMNS);
    });

    await test.step('Data rows and status summary', async () => {
      console.log(`[${menu}] data rows shown on this page: ${dataRowCount}`);
      if (dataRowCount === 0) {
        console.log(`[${menu}] WARNING: no data rows. Compare with the screenshot and the page by hand.`);
        return;
      }
      const { statuses } = await this.statusSummary(menu, { printUnknown: true });
      if (expectStatuses) {
        const outside = statuses.filter(s => !expectStatuses.includes(s));
        console.log(`[${menu}] allowed statuses: ${expectStatuses.join(', ')}`);
        expect.soft(outside.length, `${outside.length} row(s) have a status outside: ${expectStatuses.join(', ')}`)
          .toBe(0);
      }
    });

    await test.step('No error messages', async () => {
      await this.checkNoErrors(menu);
    });

    await test.step('Screenshot as evidence', async () => {
      await this.screenshot(menu);
    });
  }
}

class MySubmittedInvoicesPage extends InvoiceListPage {
  constructor(page) {
    super(page, { menu: 'My Submitted Invoices' });
  }

  async verify(options) {
    await super.verify(options);
    await test.step('Row count text is shown at the bottom', async () => {
      // looks for text like "1 to 20 of 8,341"
      const paging = this.page.getByText(/\d[\d,]*\s*to\s*\d[\d,]*\s*of\s*\d[\d,]*/).first();
      await paging.scrollIntoViewIfNeeded().catch(() => {});
      await expect.soft(paging).toBeVisible({ timeout: 20000 });
    });
  }
}

class MyPendingInvoicesPage extends InvoiceListPage {
  constructor(page) {
    // this page is slow to load, so it gets up to 150 seconds per attempt
    super(page, { menu: 'My Pending Invoices', waitSeconds: 150 });
  }
}

class MyApprovedInvoicesPage extends InvoiceListPage {
  constructor(page) {
    super(page, { menu: 'My Approved Invoices' });
  }
}

class MyCompletedInvoicesPage extends InvoiceListPage {
  constructor(page) {
    super(page, { menu: 'My Completed Invoices' });
  }
}

class AllPendingInvoicesPage extends InvoiceListPage {
  constructor(page) {
    super(page, { menu: 'All Pending Invoices' });
  }
}

module.exports = {
  MySubmittedInvoicesPage,
  MyPendingInvoicesPage,
  MyApprovedInvoicesPage,
  MyCompletedInvoicesPage,
  AllPendingInvoicesPage,
};