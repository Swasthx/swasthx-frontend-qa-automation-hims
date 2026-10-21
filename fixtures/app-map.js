import { API_BASE_URL } from '../utils/env.js';

// Every route and endpoint the specs use, in one place. Fix drift here, not in the specs.

export const PATHS = {
  pharmacy: {
    // Orders have no page of their own: they open as modals from the queue.
    queue: '/pharmacy/queue',
    patient: '/pharmacy/patient',
  },
};

export const API = {
  pharmacy: {
    orders: '/pharmacy/orders', //                         staff (JWT), hospital-scoped
    order: (id) => `/pharmacy/orders/${id}`,
    phrOrder: (id) => `/pharmacy/phr/orders/${id}`, //     patient app: ?hospitalId&patientId|phone
    // Path fragment of the call that loads the queue. Empty = match every API call.
    queue: process.env.PH_QUEUE_API || '/pharmacy/orders',
  },
  diagnostic: {
    phrBookings: '/diagnostic/phr/bookings', //            patient app lab-test booking
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
