const { test } = require('@playwright/test');
const { BasePage } = require('../../Page/BasePage');
const {
  MySubmittedInvoicesPage,
  MyPendingInvoicesPage,
  MyApprovedInvoicesPage,
  MyCompletedInvoicesPage,
  AllPendingInvoicesPage,
} = require('../../Page/InvoicePages');

let basePage;

// VIEW ONLY: these tests never create, approve, clone or change an invoice
test.describe('Invoice list pages @invoices', () => {

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.openSite();
  });

  test('My Submitted Invoices page @smoke', async ({ page }) => {
    const invoicePage = new MySubmittedInvoicesPage(page);
    await invoicePage.open();
    await invoicePage.verify();
  });

  test('My Pending Invoices page @smoke', async ({ page }) => {
    const invoicePage = new MyPendingInvoicesPage(page);
    await invoicePage.open();
    // TODO: when the manager confirms the rule, add { expectStatuses: ['...'] } to verify()
    await invoicePage.verify();
  });

  test('My Approved Invoices page @smoke', async ({ page }) => {
    const invoicePage = new MyApprovedInvoicesPage(page);
    await invoicePage.open();
    // TODO: add { expectStatuses: [...] } once the rule is confirmed
    await invoicePage.verify();
  });

  test('My Completed Invoices page @smoke', async ({ page }) => {
    const invoicePage = new MyCompletedInvoicesPage(page);
    await invoicePage.open();
    // TODO: add { expectStatuses: [...] } once the rule is confirmed
    await invoicePage.verify();
  });

  test('All Pending Invoices page @smoke', async ({ page }) => {
    const invoicePage = new AllPendingInvoicesPage(page);
    await invoicePage.open();
    // TODO: add { expectStatuses: [...] } once the rule is confirmed
    await invoicePage.verify();
  });

});