/**
 * A CSV reader, written out rather than installed.
 *
 * RFC 4180 is small enough that the whole parser is fifty lines, and the
 * cases a dependency would buy — streaming gigabytes, exotic dialects — are
 * cases a 300-row research spreadsheet never hits. What it does handle is
 * what spreadsheets actually emit: quoted fields, embedded commas, embedded
 * newlines, doubled quotes, and CRLF.
 */

export function parseCsv(input: string): Record<string, string>[] {
  const rows = parseRows(input.replace(/^﻿/, ""));
  if (rows.length === 0) return [];

  const header = (rows[0] ?? []).map((cell) => cell.trim());
  const records: Record<string, string>[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row) continue;
    // A trailing newline produces one empty cell; that is not a record.
    if (row.length === 1 && (row[0] ?? "").trim() === "") continue;

    const record: Record<string, string> = {};
    header.forEach((column, position) => {
      if (column) record[column] = (row[position] ?? "").trim();
    });
    records.push(record);
  }

  return records;
}

function parseRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/** `"a, b , c"` → `["a", "b", "c"]`. Empty input gives an empty list. */
export function splitList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** Accepts what a spreadsheet's "yes" column plausibly contains. */
export function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ["true", "yes", "y", "1", "x"].includes(value.trim().toLowerCase());
}
