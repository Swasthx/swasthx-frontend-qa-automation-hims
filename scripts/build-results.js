// Usage: npm run results [-- <category-key> ...]
// Rebuilds Test-result/*.md from Test-case-csv (plan), Test-result/data (automated results)
// and Test-case-csv/manual-results.csv, without running any test. Run it after recording
// manual outcomes or editing execution-plan.js.
import 'dotenv/config';
import { CATEGORIES, renderCategory } from '../utils/results.js';

const wanted = process.argv.slice(2);
const unknown = wanted.filter((k) => !CATEGORIES.some((c) => c.key === k));
if (unknown.length) {
  console.error(`Unknown category: ${unknown.join(', ')}. Known: ${CATEGORIES.map((c) => c.key).join(', ')}`);
  process.exit(1);
}
for (const c of CATEGORIES.filter((c) => !wanted.length || wanted.includes(c.key))) {
  console.log(`  ${renderCategory(c)}`);
}
