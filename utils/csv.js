import fs from 'node:fs';

/** RFC 4180 parser: quoted fields, embedded commas/quotes/newlines. Returns rows of strings. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Reads a CSV with a header row into objects keyed by header (extra cells are dropped). */
export function readCsvObjects(file) {
  const [header, ...rows] = parseCsv(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  const cols = header.map((h) => h.trim());
  return { columns: cols, rows: rows.map((r) => Object.fromEntries(cols.map((c, i) => [c, (r[i] ?? '').trim()]))) };
}

/** Quotes a value for CSV output when needed. */
export const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
