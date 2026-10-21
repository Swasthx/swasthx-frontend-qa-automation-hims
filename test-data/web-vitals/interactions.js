// INP needs a user interaction. One scripted interaction per INP TC, chosen from what each
// QA page actually renders. All are non-mutating: tab switches, opening a form/modal
// without saving, filter resets. Never point these at Save/Send/Rebuild-type buttons.

const click = (name) => ({
  label: `click "${name}"`,
  run: (page) => page.getByRole('button', { name: typeof name === 'string' ? name : name }).first().click(),
});
const tab = (prefix) => ({
  label: `click tab "${prefix}…"`,
  run: (page) => page.getByRole('button', { name: new RegExp(`^${prefix}\\b`) }).first().click(),
});

export const INTERACTIONS = {
  'SA-WV-002': click('Edit Profile'),
  'SA-WV-008': tab('Active'),
  'SA-WV-010': click('Add User'),
  'AD-WV-002': click('Edit Profile'),
  'AD-WV-006': click('Refresh analytics'),
  'AD-WV-008': click('Reset filters'),
  'RCP-WV-002': click('Edit Profile'),
  'RCP-WV-005': tab('Follow'),
  'RCP-WV-007': tab('Patient Appointments'),
  'DOC-WV-002': click('Edit Profile'),
  'DOC-WV-006': click('Visit History'),
  'DOC-WV-008': click('Week'),
  'DIAG-WV-002': click('Edit Profile'),
  'DIAG-WV-005': tab('Report Published'),
  'PH-WV-002': click('Edit Profile'),
  'PH-WV-007': tab('Order Delivered'),
  'PH-WV-008': tab('My Patient'),
};

// Route params the sheet leaves symbolic. Missing → the TC is reported NOT RUN.
export const ROUTE_PARAMS = {
  ':patientId': process.env.DOC_CONSULT_PATIENT_ID,
};
