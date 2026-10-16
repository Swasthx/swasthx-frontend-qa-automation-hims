import { API_BASE_URL } from '../utils/env.js';

// Every route and endpoint the specs assume, in one place. This repo has no access
// to the product source, so anything marked TODO(calibrate) is a best guess. Confirm it
// in DevTools → Network (or `npm run codegen -- <role>`) and fix it here, not in the specs.

export const PATHS = {
  pharmacy: {
    queue: '/pharmacy/queue',
    patient: '/pharmacy/patient',
  },
};

export const API = {
  pharmacy: {
    // TODO(calibrate): endpoint the UI calls to place a pharmacy/home-test order.
    createOrder: process.env.PH_CREATE_ORDER_API || '/pharmacy/orders',
    // Path fragment of the call that loads the queue. Empty = match every API call.
    queue: process.env.PH_QUEUE_API || '',
  },
};

export const apiUrl = (path) => `${API_BASE_URL()}${path}`;

/**
 * page.route() predicate that matches XHR/fetch calls to the API only, never the SPA's
 * own document routes. (A glob like `**\/pharmacy/queue**` would also catch the page URL.)
 */
export function isApiUrl(fragment = '') {
  const base = new URL(API_BASE_URL());
  return (url) => url.origin === base.origin && url.pathname.startsWith(base.pathname) && url.pathname.includes(fragment);
}
