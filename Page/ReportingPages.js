const { test, expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const { REPORT_COLUMNS, EMPTY_GRID_MESSAGE } = require('../fixtures/TestData');

class ReportingPage extends BasePage {
  // opensWithData: true for pages that already list invoices when opened
  constructor(page, { menu, heading, texts = [], buttons = ['Export'], columns = REPORT_COLUMNS, opensWithData = false }) {
    super(page);
    Object.assign(this, { menu, heading, texts, buttons, columns, opensWithData });
  }

  async open() {
    await this.clickMenu(this.menu, {
      section: 'REPORTING',
      heading: this.heading,
      grid: this.opensWithData,
    });
  }

  // VIEW ONLY: never types and never clicks
  async verify() {
    const { page, menu } = this;

    await test.step(`Heading "${this.heading}" shows in the white area`, async () => {
      await this.checkHeading(menu, this.heading);
    });

    await test.step('Labels are shown', async () => {
      for (const t of this.texts) {
        await expect.soft(this.visibleFirst(page.getByText(t)), `Text "${t}"`).toBeVisible();
      }
    });

    await test.step('Buttons are shown (not clicked)', async () => {
      for (const b of this.buttons) {
        await expect.soft(this.visibleFirst(page.getByText(b, { exact: true })), `Button "${b}"`).toBeVisible();
      }
    });

    await test.step('Grid column headers', async () => {
      await this.checkColumns(menu, this.columns);
    });

    await test.step('Grid content', async () => {
      const dataRows = Math.max((await this.allRows.count()) - 1, 0);
      console.log(`[${menu}] data rows shown on this page: ${dataRows}`);
      if (this.opensWithData) {
        await this.statusSummary(menu);
        // 0 rows can be legitimate if nothing is listed, so check by hand if this fails
        expect.soft(dataRows, 'No rows shown, check the page by hand').toBeGreaterThan(0);
      } else {
        await expect.soft(this.visibleFirst(page.getByText(EMPTY_GRID_MESSAGE)),
          `Empty message "${EMPTY_GRID_MESSAGE}"`).toBeVisible();
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

class ByContractsPage extends ReportingPage {
  constructor(page) {
    super(page, {
      menu: 'By Contracts',
      heading: 'Invoices By Contract',
      texts: ['SELECT A VENDOR', 'SELECT A CONTRACT', /Type 3 char to search/],
    });
  }
}

class ByProjectsPage extends ReportingPage {
  constructor(page) {
    super(page, {
      menu: 'By Projects',
      heading: 'Invoices By Project',
      texts: ['SELECT A PROJECT', /Type 3 char to search/],
    });
  }
}

class ByGroupsPage extends ReportingPage {
  constructor(page) {
    super(page, {
      menu: 'By Groups',
      heading: 'Invoices By Group',
      texts: ['SELECT A GROUP', /Select a group/],
      columns: ['ID', 'CONTRACTID', 'VENDOR NAME', 'PROJECT', 'INVOICE NO.', 'DESCRIPTION',
        'AMOUNT', 'SUBMITTED', 'START DATE', 'END DATE', 'FINANCIAL REVIEWER', 'STATUS'],
    });
  }
}

class ByUserPage extends ReportingPage {
  constructor(page) {
    super(page, {
      menu: 'By User',
      heading: 'Pending Invoices By User',
      texts: ['SELECT A USER'],
      columns: ['ID', 'CONTRACTID', 'VENDOR NAME', 'PROJECT', 'INVOICE NO.', 'DESCRIPTION',
        'AMOUNT', 'SUBMITTED', 'LATEST REVISION', 'START DATE', 'END DATE', 'STATUS',
        'PROJECT ENGINEER', 'PROJECT MANAGER', 'ADDITIONAL REVIEWER', 'FINANCE'],
    });
  }
}

class ByStatusPage extends ReportingPage {
  constructor(page) {
    super(page, {
      menu: 'By Status',
      heading: 'Invoices By Status',
      texts: ['SELECT A INVOICE STATUS', /Type 3 char to search/],
    });
  }
}

class ByIdPage extends ReportingPage {
  constructor(page) {
    super(page, {
      menu: 'By ID',
      heading: 'Find Invoice By ID',
      texts: ['ENTER DIME ID'],
      buttons: ['Search', 'Export'],
    });
  }
}

class UnassignedInvoicesPage extends ReportingPage {
  constructor(page) {
    super(page, {
      menu: 'Unassigned Invoices',
      heading: 'Unassigned Invoices',
      opensWithData: true,
      columns: ['ID', 'CONTRACTID', 'VENDOR NAME', 'PROJECT', 'INVOICE NO.', 'DESCRIPTION',
        'AMOUNT', 'SUBMITTED', 'START DATE', 'END DATE', 'GROUP', 'STATUS'],
    });
  }
}

class PendingSendToApPage extends ReportingPage {
  constructor(page) {
    super(page, {
      menu: 'Pending Send to AP',
      heading: 'Invoices to Send to AP',
      opensWithData: true,
    });
  }
}

module.exports = {
  ByContractsPage,
  ByProjectsPage,
  ByGroupsPage,
  ByUserPage,
  ByStatusPage,
  ByIdPage,
  UnassignedInvoicesPage,
  PendingSendToApPage,
};