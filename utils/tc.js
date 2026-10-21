/**
 * Refines how a test shows up in its TC's result-sheet row (see reporters/sheet-reporter.js).
 * Call as often as needed; the last call wins for each field. Without it, the row
 * status comes from the Playwright outcome (passed → PASS, failed → FAIL, skipped → NOT RUN).
 *
 *   recordTc(testInfo, { measured: '1.92s', runs: ['1.8s', '2.0s'], notes: ['Engine: playwright'] })
 *   recordTc(testInfo, { status: 'ERROR', notes: ['Landed on /login'] })
 */
export function recordTc(testInfo, fields) {
  const prev = testInfo.annotations.filter((a) => a.type === 'tc-result').map((a) => JSON.parse(a.description)).at(-1) ?? {};
  testInfo.annotations.push({ type: 'tc-result', description: JSON.stringify({ ...prev, ...fields }) });
}

/** The annotation that ties a test to a TC ID in Test-case-csv. */
export const tc = (id) => ({ annotation: { type: 'tc', description: id } });
