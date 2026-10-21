// Role registry. `key` is what specs pass to asRole()/test.use({ role }).
// `landing` is where the login screen sends each role after a successful login.
export const ROLES = {
  superadmin: { code: 'SA', prefix: '/superadmin', roleString: 'super admin', landing: '/superadmin/profile' },
  admin: { code: 'AD', prefix: '/admin', roleString: 'admin', landing: '/admin/profile' },
  reception: { code: 'RCP', prefix: '/reception', roleString: 'reception', landing: '/reception/profile' },
  doctor: { code: 'DOC', prefix: '/doctor', roleString: 'doctor', landing: '/doctor/profile' },
  diagnostic: { code: 'DIAG', prefix: '/diagnostic', roleString: 'diagnostic', landing: '/diagnostic' },
  pharmacy: { code: 'PH', prefix: '/pharmacy', roleString: 'pharmacy', landing: '/pharmacy/profile' },
};

export const ROLE_KEYS = Object.keys(ROLES);

export function getRole(key) {
  const role = ROLES[key];
  if (!role) throw new Error(`Unknown role "${key}". Expected one of: ${ROLE_KEYS.join(', ')}`);
  return { key, ...role };
}

// TEST_<ROLE>_PHONE / _OTP
export function roleCreds(key) {
  const p = `TEST_${key.toUpperCase()}_`;
  return {
    phone: process.env[`${p}PHONE`] || '',
    otp: process.env[`${p}OTP`] || '',
  };
}
