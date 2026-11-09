const { test } = require('@playwright/test');
const { BasePage } = require('../../Page/BasePage');
const {
  AddUpdateUserPage,
  ChangeApEmailPage,
  ChangeReviewerPage,
  ChangeRoutingPage,
  EditGroupsPage,
  RevertWorkflowPage,
} = require('../../Page/AdminPages');

let basePage;

// VIEW ONLY: the account has Admin rights, so these tests NEVER click Add, Edit, Delete,
// Submit, Update or Search, and NEVER type into a field. Do not add any of that here.
test.describe('Admin section pages (view only) @admin', () => {

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.openSite();
  });

  test('Add / Update User page shows the user list', async ({ page }) => {
    const adminPage = new AddUpdateUserPage(page);
    await adminPage.open();
    await adminPage.verify();
  });

  test('Change AP Email page shows the email field', async ({ page }) => {
    const adminPage = new ChangeApEmailPage(page);
    await adminPage.open();
    await adminPage.verify();
  });

  test('Change Reviewer page shows the two user boxes', async ({ page }) => {
    const adminPage = new ChangeReviewerPage(page);
    await adminPage.open();
    await adminPage.verify();
  });

  test('Change Routing page shows the routing list', async ({ page }) => {
    const adminPage = new ChangeRoutingPage(page);
    await adminPage.open();
    await adminPage.verify();
  });

  test('Edit Groups page shows the group list', async ({ page }) => {
    const adminPage = new EditGroupsPage(page);
    await adminPage.open();
    await adminPage.verify();
  });

  test('Revert Workflow page opens with an empty grid', async ({ page }) => {
    const adminPage = new RevertWorkflowPage(page);
    await adminPage.open();
    await adminPage.verify();
  });

});