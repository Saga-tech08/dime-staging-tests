const { test, expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class AdminPage extends BasePage {
  constructor(page, { menu, heading, texts = [], searchHints = [], buttons = [], columns = [], opensWithData = false }) {
    super(page);
    Object.assign(this, { menu, heading, texts, searchHints, buttons, columns, opensWithData });
  }

  async open() {
    await this.clickMenu(this.menu, { section: 'ADMIN', heading: this.heading, grid: false });
    if (this.opensWithData) {
      await this.allRows.nth(1).waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});
    }
  }

  // each page can add its own read-only checks here
  async verifyExtras() {}

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

    await test.step('Search boxes are shown', async () => {
      for (const h of this.searchHints) {
        // the hint can be a placeholder or plain text
        const either = page.getByPlaceholder(h).or(page.getByText(h));
        await expect.soft(this.visibleFirst(either), `Search hint "${h}"`).toBeVisible();
      }
    });

    await test.step('Buttons are shown (not clicked)', async () => {
      for (const b of this.buttons) {
        const locator = page.getByText(b, { exact: true });
        console.log(`[${menu}] button "${b}" found ${await locator.count()} time(s)`);
        await expect.soft(this.visibleFirst(locator), `Button "${b}"`).toBeVisible();
      }
    });

    await test.step('Grid column headers', async () => {
      if (this.columns.length > 0) await this.checkColumns(menu, this.columns);
    });

    await test.step('Page specific checks (read only)', async () => {
      await this.verifyExtras();
    });

    await test.step('No error messages', async () => {
      await this.checkNoErrors(menu);
    });

    await test.step('Screenshot as evidence', async () => {
      await this.screenshot(menu);
    });
  }
}

class AddUpdateUserPage extends AdminPage {
  constructor(page) {
    super(page, {
      menu: 'Add / Update User',
      heading: 'List of Users',
      searchHints: ['Search for a User/Role...'],
      buttons: ['Add User', 'Edit'],
      columns: ['NAME', 'EMAIL', 'VENDOR', 'ROLE', 'IS ACTIVE'],
      opensWithData: true,
    });
  }

  async verifyExtras() {
    const dataRows = Math.max((await this.allRows.count()) - 1, 0);
    console.log(`[${this.menu}] data rows: ${dataRows}`);
    // role summary: counts only, no names or emails
    const roles = ['Additional Reviewer', 'Global Reader', 'Contract Manager', 'Administrator',
      'Approver', 'Finance', 'Submitter'];
    const counts = {};
    for (const t of (await this.allRows.allInnerTexts()).slice(1)) {
      const role = roles.find(r => t.includes(r)) || 'OTHER';
      counts[role] = (counts[role] || 0) + 1;
    }
    console.log(`[${this.menu}] role summary: ${JSON.stringify(counts)}`);
    expect.soft(dataRows, 'No users shown, check the page by hand').toBeGreaterThan(0);
  }
}

class ChangeApEmailPage extends AdminPage {
  constructor(page) {
    super(page, {
      menu: 'Change AP Email',
      heading: 'Change AP Email Address',
      texts: ['ACCOUNTS PAYABLE EMAIL ADDRESS'],
      buttons: ['Update'],
    });
  }

  // never types in the field, never clicks Update, never prints the email address
  async verifyExtras() {
    const hasEmailValue = await this.page.locator('input').evaluateAll(els =>
      els.some(e => (e.offsetWidth || e.offsetHeight) && /@/.test(e.value)));
    console.log(`[${this.menu}] email field shows a value: ${hasEmailValue}`);

    const update = this.page.getByRole('button', { name: 'Update' });
    if (await update.count()) {
      console.log(`[${this.menu}] Update button greyed out: ${await update.first().isDisabled()}`);
    } else {
      console.log(`[${this.menu}] Update is not exposed as a button, so its state was not read`);
    }
    expect.soft(hasEmailValue, 'The email field looks empty, check the page by hand').toBe(true);
  }
}

class ChangeReviewerPage extends AdminPage {
  constructor(page) {
    super(page, {
      menu: 'Change Reviewer',
      heading: 'Change Reviewer',
      texts: ['SELECT USER', 'REPLACE USER'],
      searchHints: ['Search for name...'],
      buttons: ['Submit'],
    });
  }

  // never clicks into the boxes and never clicks Submit
  async verifyExtras() {
    const boxes = this.page.getByPlaceholder('Search for name...').filter({ visible: true });
    const count = await boxes.count();
    console.log(`[${this.menu}] visible user search boxes: ${count} (expected 2)`);
    expect.soft(count, 'Expected the SELECT USER and REPLACE USER boxes').toBe(2);

    const submit = this.page.getByRole('button', { name: 'Submit' });
    if (await submit.count()) {
      console.log(`[${this.menu}] Submit button greyed out: ${await submit.first().isDisabled()}`);
    } else {
      console.log(`[${this.menu}] Submit is not exposed as a button, so its state was not read`);
    }
  }
}

class ChangeRoutingPage extends AdminPage {
  constructor(page) {
    super(page, {
      menu: 'Change Routing',
      heading: 'List of Routings',
      searchHints: ['Search for Contract or Project...'],
      buttons: [/^New Rout/],
      columns: ['CONTRACT NUMBER', 'PROJECT NUMBER', 'PROJECT MANAGER', 'PROJECT ENGINEER', 'FINANCE'],
      opensWithData: true,
    });
  }

  async verifyExtras() {
    const dataRows = Math.max((await this.allRows.count()) - 1, 0);
    console.log(`[${this.menu}] data rows: ${dataRows}`);
    expect.soft(dataRows, 'No routings shown, check the page by hand').toBeGreaterThan(0);
  }
}

class EditGroupsPage extends AdminPage {
  constructor(page) {
    super(page, {
      menu: 'Edit Groups',
      heading: 'List of Groups',
      searchHints: ['Search for Group...'],
      buttons: [/^Add Gro/, 'Edit', 'Delete'],
      columns: ['CATEGORY NAME'],
      opensWithData: true,
    });
  }

  // never clicks Add Group, Edit or Delete
  async verifyExtras() {
    const dataRows = Math.max((await this.allRows.count()) - 1, 0);
    const edits = await this.page.getByText('Edit', { exact: true }).filter({ visible: true }).count();
    const deletes = await this.page.getByText('Delete', { exact: true }).filter({ visible: true }).count();
    console.log(`[${this.menu}] data rows: ${dataRows}, visible Edit buttons: ${edits}, Delete buttons: ${deletes}`);
    expect.soft(dataRows, 'No groups shown, check the page by hand').toBeGreaterThan(0);
  }
}

class RevertWorkflowPage extends AdminPage {
  constructor(page) {
    super(page, {
      menu: 'Revert Workflow',
      heading: 'Revert Workflow',
      texts: ['ENTER DIME ID', 'There are no Invoices to show here!'],
      buttons: ['Search', 'Export'],
      columns: ['CONTRACT', 'VENDOR NAME', 'INVOICE NO', 'DESCRIPTI', 'AMOUNT',
        'SUBMITTE', 'START DATE', 'END DATE', 'STATUS'],
    });
  }

  // never enters an invoice ID and never clicks Search
  async verifyExtras() {
    const dataRows = Math.max((await this.allRows.count()) - 1, 0);
    console.log(`[${this.menu}] data rows shown on this page: ${dataRows}`);
    expect.soft(dataRows, 'The grid should open empty').toBe(0);
  }
}

module.exports = {
  AddUpdateUserPage,
  ChangeApEmailPage,
  ChangeReviewerPage,
  ChangeRoutingPage,
  EditGroupsPage,
  RevertWorkflowPage,
};