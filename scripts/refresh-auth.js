// Usage: npm run auth:refresh   — forces a fresh API login for every role that has creds.
process.env.AUTH_REFRESH = '1';
const { default: globalSetup } = await import('../global-setup.js');
await globalSetup();
