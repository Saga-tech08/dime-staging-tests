# Introduction
Automated, view-only Playwright checks for the DIME staging site (SharePoint test site).

The objective is to confirm that the invoice list, reporting and admin pages open correctly and show the expected content. For each page the tests check the heading, labels, buttons and grid column headers, confirm that no error message is shown, and save a screenshot as evidence.

The tests never create, edit, delete, approve or submit anything, and they never type into a field. They only look at the pages.

| Section | Test file | Tests |
|---|---|---|
| Invoice list pages | `tests/DimeApp/InvoicePages.test.js` | 5 |
| Reporting pages | `tests/DimeApp/ReportingSection.test.js` | 8 |
| Admin pages | `tests/DimeApp/AdminSection.test.js` | 6 |

# Getting Started
Follow these steps to run the project on your own system.

1.	Installation process

	Install the software below, then run these commands:

	```bash
	git clone https://github.com/Saga-tech08/dime-staging-tests.git
	cd dime-staging-tests
	npm install
	npx playwright install chromium
	```

2.	Software dependencies
	- Node.js (a current LTS version; the project was built with Node 24)
	- Git
	- Playwright (`@playwright/test`, installed by `npm install`)
	- Chromium (installed by `npx playwright install chromium`)
	- A DIME staging account that can sign in to the site

3.	Latest releases

	No releases yet. The work is on the `pom-framework` branch.

4.	API references

	Not applicable. The tests use the Playwright test API: https://playwright.dev/docs/api/class-test

5.	Login (required before every run)

	The site uses Microsoft sign-in with MFA, so the login is done by hand and the session is saved for the tests to reuse.

	```bash
	npm run login
	```

	1. A browser opens. Sign in with your work email, password and MFA.
	2. If it asks "Stay signed in?", click **Yes**.
	3. Wait until the blue DIME menu is visible.
	4. Close the browser with the **X** (do not press Ctrl + C).

	The session is saved to `playwright/.auth/user.json`. This file is private and ignored by Git. Never commit it. The session expires after a few hours, so repeat this step when the tests report that the login expired.

	Check that the saved login works:

	```bash
	npx playwright test login-check
	```

# Build and Test
There is no build step. Run one section at a time, because the staging site is slow and its data is shared.

```bash
npm run test:reporting   # 8 tests, about 4 minutes
npm run test:admin       # 6 tests, about 3 to 5 minutes
npm run test:invoices    # 5 tests, about 6 minutes (My Pending Invoices is slow)
```

List all tests without running them (expected: 19 tests in 3 files):

```bash
npx playwright test tests/DimeApp --list
```

Read the results:

- The terminal prints a pass or fail line for each page, plus row counts and statuses found.
- Open the HTML report with screenshots: `npx playwright show-report`
- A JUnit file is written to `test-results/results.xml`.

Project structure:

```
Page/                    Page objects: one class per screen
  BasePage.js            Shared helpers (open site, menu clicks, checks)
  InvoicePages.js        Five invoice list pages
  ReportingPages.js      Eight reporting pages
  AdminPages.js          Six admin pages
tests/DimeApp/           Test files (each calls open() and verify())
fixtures/TestData.js     Expected column names and messages
config/env.js            Site URL
playwright.config.js     Run settings
```

Run settings (in `playwright.config.js`): Chromium only, one test at a time, no retries, 15 minutes per test (slow site), and the saved login from `playwright/.auth/user.json`.

Troubleshooting:

| Problem | What to do |
|---|---|
| `LOGIN EXPIRED` or a Microsoft sign-in page appears | Run `npm run login` again. |
| `Cannot find module ...` | A file name or folder is wrong. Check capital letters in `Page` and `DimeApp`. |
| `Missing script: "test:reporting"` | Check the `scripts` block in `package.json`. Run `npm run` to list scripts. |
| A page takes a long time | My Pending Invoices can take about 2 minutes to open. Wait for the test to finish. |
| `... is not a function` | A helper is missing from `Page/BasePage.js`. Send the error to the maintainer. |

# Contribute
1. Create a branch from `main` and make your change there.
2. Keep tests view-only. Do not add clicks on Add, Edit, Delete, Submit, Update, Search or Export, and do not type into fields. The test account may have Admin rights.
3. Put page details (headings, labels, columns) in the page classes in `Page/`, not in the test files.
4. Never put passwords, tokens or session files in the code or in Git.
5. Run `npx playwright test tests/DimeApp --list` and the affected section before you commit.

Known limits:

- The login is manual because the account uses MFA. Unattended runs need a test account without MFA, which has to be approved first.
- Expected statuses per invoice page are not enforced yet. `InvoicePages.js` supports an `expectStatuses` option once the rules are confirmed.
