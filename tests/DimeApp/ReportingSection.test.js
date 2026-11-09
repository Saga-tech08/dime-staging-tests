const { test } = require('@playwright/test');
const { BasePage } = require('../../Page/BasePage');
const {
  ByContractsPage,
  ByProjectsPage,
  ByGroupsPage,
  ByUserPage,
  ByStatusPage,
  ByIdPage,
  UnassignedInvoicesPage,
  PendingSendToApPage,
} = require('../../Page/ReportingPages');

let basePage;

// VIEW ONLY: never types in a selector, never clicks Search or Export
test.describe('Validation Reporting sections: @reporting', () => {

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.openSite();
  });

  test('Validation of "By Contracts" page under reporting section', async ({ page }) => {
    const reportPage = new ByContractsPage(page);
    await reportPage.open();
    await reportPage.verify();
  });

  test('Validation of "By Projects" page under reporting section', async ({ page }) => {
    const reportPage = new ByProjectsPage(page);
    await reportPage.open();
    await reportPage.verify();
  });

  test('Validation of "By Groups" page under reporting section', async ({ page }) => {
    const reportPage = new ByGroupsPage(page);
    await reportPage.open();
    await reportPage.verify();
  });

  test('Validation of "By User" page under reporting section', async ({ page }) => {
    const reportPage = new ByUserPage(page);
    await reportPage.open();
    await reportPage.verify();
  });

  test('Validation of "By Status" page under reporting section', async ({ page }) => {
    const reportPage = new ByStatusPage(page);
    await reportPage.open();
    await reportPage.verify();
  });

  test('Validation of "By ID" page under reporting section', async ({ page }) => {
    const reportPage = new ByIdPage(page);
    await reportPage.open();
    await reportPage.verify();
  });

  test('Validation of "Unassigned Invoices" page under reporting section', async ({ page }) => {
    const reportPage = new UnassignedInvoicesPage(page);
    await reportPage.open();
    await reportPage.verify();
  });

  test('Validation of "Pending Send to AP" page under reporting section', async ({ page }) => {
    const reportPage = new PendingSendToApPage(page);
    await reportPage.open();
    await reportPage.verify();
  });

});