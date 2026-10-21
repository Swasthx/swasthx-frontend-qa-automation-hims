import { CATEGORIES, aggregate, loadState, renderCategory, saveState, tcIndex } from '../utils/results.js';

/**
 * Turns test results into the per-category result sheets (Test-result/<category>Result.md).
 *
 * A test belongs to a TC through its `{ type: 'tc', description: '<TC ID>' }` annotation.
 * Several tests (sub-checks, browser projects) may share one TC; they are aggregated into
 * one row (any FAIL → FAIL). Specs can refine a row with recordTc() (utils/tc.js).
 * Tests whose TC ID isn't in any Test-case-csv file are ignored here.
 * Results merge into Test-result/data/<category>.json, so partial runs only touch their rows.
 */
export default class SheetReporter {
  constructor() {
    this.byTc = new Map();
  }

  onBegin() {
    this.startedAt = new Date();
    this.index = tcIndex();
  }

  onTestEnd(test, result) {
    const annotations = [...test.annotations, ...(result.annotations ?? [])];
    const tcIds = [...new Set(annotations.filter((a) => a.type === 'tc').map((a) => a.description))].filter((id) => this.index.has(id));
    if (!tcIds.length) return;

    const recorded = annotations.filter((a) => a.type === 'tc-result').map((a) => JSON.parse(a.description));
    const last = recorded.at(-1) ?? {};
    let status = last.status;
    if (!status) status = result.status === 'passed' ? 'PASS' : result.status === 'skipped' ? 'NOT RUN' : 'FAIL';
    // A thrown non-assertion error (timeout, crash) means the check couldn't complete.
    if ((result.status === 'timedOut' || result.status === 'interrupted') && status !== 'FAIL') status = 'ERROR';
    if (result.status === 'failed' && status === 'PASS') status = 'FAIL';

    const entry = {
      project: test.parent.project()?.name ?? 'default',
      subtitle: test.title.replace(/^\S+\s/, ''),
      status,
      measured: last.measured,
      runs: last.runs,
      reports: last.reports,
      notes: last.notes ?? [],
      error: result.error ? firstLine(result.error.message) : undefined,
      skipReason: annotations.find((a) => a.type === 'skip')?.description,
    };
    // onTestEnd fires once per attempt; keyed by test id, the final attempt (after retries) wins.
    for (const id of tcIds) {
      if (!this.byTc.has(id)) this.byTc.set(id, new Map());
      this.byTc.get(id).set(test.id, entry);
    }
  }

  onEnd() {
    if (!this.byTc.size) return;
    const touched = new Set();
    const states = new Map();
    for (const [id, results] of this.byTc) {
      const key = this.index.get(id);
      if (!states.has(key)) states.set(key, loadState(key));
      states.get(key)[id] = aggregate([...results.values()], this.startedAt.toISOString());
      touched.add(key);
    }
    const files = [];
    for (const key of touched) {
      saveState(key, states.get(key));
      files.push(renderCategory(CATEGORIES.find((c) => c.key === key), { updatedAt: this.startedAt }));
    }
    console.log(`\n[results] updated: ${files.join(', ')}`);
  }

  printsToStdio() {
    return false;
  }
}

const firstLine = (s = '') => s.replace(/\u001b\[[0-9;]*m/g, '').split('\n').find((l) => l.trim())?.trim().slice(0, 180) ?? '';
