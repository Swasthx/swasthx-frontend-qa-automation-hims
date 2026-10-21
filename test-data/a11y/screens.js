// Which screen each module accessibility TC is scanned on. App-wide GEN-A11Y / AUTH-A11Y TCs
// are handled in their own specs; this maps the per-module (axe-based) TCs to a route.
export const A11Y_SCREENS = {
  'SA-A11Y-001': { role: 'superadmin', route: '/superadmin/hospital-analytics', area: 'HospitalAnalytics charts' },
  'SA-A11Y-002': { role: 'superadmin', route: '/superadmin/orders', area: 'Orders table + filters' },
  'SA-A11Y-003': { role: 'superadmin', route: '/superadmin/manageHospital', area: 'ManageHospital form' },
  'AD-A11Y-001': { role: 'admin', route: '/admin/auditlog', area: 'AuditLog table' },
  'AD-A11Y-002': { role: 'admin', route: '/admin/auditlog', area: 'AuditLog sortable headers' },
  'AD-A11Y-003': { role: 'admin', route: '/admin/shiftschedule', area: 'ShiftCalendar (dnd-kit)' },
  'AD-A11Y-004': { role: 'admin', route: '/admin/RBACPermission', area: 'RBAC permission matrix' },
  'AD-A11Y-005': { role: 'admin', route: '/admin/operationsdashboard', area: 'Config modals (scanned closed)' },
  'RCP-A11Y-001': { role: 'reception', route: '/reception/queue', area: 'ReceptionQueue actions' },
  'RCP-A11Y-002': { role: 'reception', route: '/reception/queue', area: 'ReceptionQueue live updates' },
  'RCP-A11Y-003': { role: 'reception', route: '/reception/patient', area: 'ReceptionPatient search' },
  'DOC-A11Y-001': { role: 'doctor', route: '/doctor/consult/:patientId', area: 'Consult prescription form' },
  'DOC-A11Y-002': { role: 'doctor', route: '/doctor/consult/:patientId', area: 'Consult custom selects' },
  'DOC-A11Y-003': { role: 'doctor', route: '/doctor/calendar', area: 'DoctorSchedule calendar' },
  'DOC-A11Y-004': { role: 'doctor', route: '/doctor/dashboard', area: 'DoctorDashboard charts' },
  'DIAG-A11Y-001': { role: 'diagnostic', route: '/diagnostic/availability', area: 'SectionAvailability grid' },
  'DIAG-A11Y-002': { role: 'diagnostic', route: '/diagnostic/queue', area: 'DiagnosticQueue' },
  'DIAG-A11Y-003': { role: 'diagnostic', route: '/diagnostic/operator/queue', area: 'Operator forms' },
  'PH-A11Y-001': { role: 'pharmacy', route: '/pharmacy/queue', area: 'PharmacyQueue actions' },
  'PH-A11Y-003': { role: 'pharmacy', route: '/pharmacy/patient', area: 'PharmacyPatient table' },
  'PH-A11Y-004': { role: 'pharmacy', route: '/pharmacy/payment', area: 'PharmacyPayment flow' },
};

// App-wide routes scanned for the GEN-A11Y aggregate TCs (one landing per role).
export const APP_WIDE_ROUTES = [
  { role: 'superadmin', route: '/superadmin/profile' },
  { role: 'admin', route: '/admin/profile' },
  { role: 'reception', route: '/reception/queue' },
  { role: 'doctor', route: '/doctor/profile' },
  { role: 'diagnostic', route: '/diagnostic/queue' },
  { role: 'pharmacy', route: '/pharmacy/queue' },
];

export function resolveRoute(route) {
  let missing = null;
  const resolved = route.replace(/:patientId/g, () => process.env.DOC_CONSULT_PATIENT_ID || ((missing = 'DOC_CONSULT_PATIENT_ID'), ':patientId'));
  return { resolved, missing };
}
