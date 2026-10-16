// Role registry. `key` is what specs pass to asRole()/test.use({ role }).
// `landing` is the first route each role should be able to open after login.
// TODO(calibrate): confirm each landing route against the running app.
export const ROLES = {
  superadmin: { code: 'SA', prefix: '/superadmin', roleString: 'super admin', landing: '/superadmin/hospital-analytics' },
  admin: { code: 'AD', prefix: '/admin', roleString: 'admin', landing: '/admin/auditlog' },
  reception: { code: 'RCP', prefix: '/reception', roleString: 'reception', landing: '/reception/queue' },
  doctor: { code: 'DOC', prefix: '/doctor', roleString: 'doctor', landing: '/doctor/calendar' },
  diagnostic: { code: 'DIAG', prefix: '/diagnostic', roleString: 'diagnostic', landing: '/diagnostic/queue' },
  pharmacy: { code: 'PH', prefix: '/pharmacy', roleString: 'pharmacy', landing: '/pharmacy/queue' },
};

export const ROLE_KEYS = Object.keys(ROLES);

export function getRole(key) {
  const role = ROLES[key];
  if (!role) throw new Error(`Unknown role "${key}". Expected one of: ${ROLE_KEYS.join(', ')}`);
  return { key, ...role };
}

// TEST_<ROLE>_PHONE / _PASSWORD / _OTP
export function roleCreds(key) {
  const p = `TEST_${key.toUpperCase()}_`;
  return {
    phone: process.env[`${p}PHONE`] || '',
    password: process.env[`${p}PASSWORD`] || '',
    otp: process.env[`${p}OTP`] || '',
  };
}
