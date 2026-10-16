import 'dotenv/config';

export function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}. Copy .env.example to .env and fill it in.`);
  return v;
}

export const BASE_URL = () => requireEnv('BASE_URL').replace(/\/+$/, '');
export const API_BASE_URL = () => requireEnv('API_BASE_URL').replace(/\/+$/, '');

const QA_HOST_HINT = /(^|[.-])(localhost|local|qa|dev|develop|staging|stage|stg|test|testing|uat|sandbox|preview)([.-]|$)/i;

function isPrivateHost(host) {
  return (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  );
}

// Allowlist, not denylist: a host must positively look like QA/local to be accepted.
export function assertNotProduction(urls) {
  const extra = (process.env.QA_ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  for (const raw of urls) {
    const host = new URL(raw).hostname.toLowerCase();
    if (isPrivateHost(host) || QA_HOST_HINT.test(host) || extra.includes(host)) continue;
    throw new Error(
      `Refusing to run: "${raw}" does not look like a QA/local host. ` +
        `If it really is QA, add "${host}" to QA_ALLOWED_HOSTS in .env. Never point this suite at production.`,
    );
  }
}
