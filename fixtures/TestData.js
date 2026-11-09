// Statuses seen so far. The most specific names come first,
// so "Revision Submitted" is matched before "Submitted".
const KNOWN_STATUSES = [
  'Initial Review Complete',
  'PE Review Complete',
  'PM Review Complete',
  'Revision Submitted',
  'Revision Needed',
  'Approved',
  'Rejected',
  'Submitted',
];

// Column headers on the invoice list pages (some are cut off on screen, so they are partial)
const INVOICE_COLUMNS = ['CONTRA', 'VENDOR', 'PROJECT', 'INVOICE', 'DESCRIPT',
  'AMOUNT', 'SUBMITT', 'START DA', 'END DATE', 'STATUS'];

// Column headers on the REPORTING pages
const REPORT_COLUMNS = ['ID', 'CONTRACTID', 'VENDOR NAME', 'PROJECT', 'INVOICE NO.',
  'DESCRIPTION', 'AMOUNT', 'SUBMITTED', 'START DATE', 'END DATE', 'STATUS'];

// Message shown by a search page before anything is searched
const EMPTY_GRID_MESSAGE = 'There are no Invoices to show here!';

module.exports = { KNOWN_STATUSES, INVOICE_COLUMNS, REPORT_COLUMNS, EMPTY_GRID_MESSAGE };