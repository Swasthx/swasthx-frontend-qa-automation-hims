// Usage: node scripts/sanitize-har.js <file.har> [...]
// Strips auth headers/cookies and token-looking fields from a recorded HAR in place.
import { sanitizeHar } from '../utils/har.js';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node scripts/sanitize-har.js <file.har> [...]');
  process.exit(1);
}
for (const f of files) {
  sanitizeHar(f);
  console.log(`sanitized ${f}`);
}
