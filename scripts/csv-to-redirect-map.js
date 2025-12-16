import fs from 'fs';
import { parse } from 'csv-parse/sync';

const csv = fs.readFileSync(
  'redirects.csv'
);

const records = parse(csv, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

const exactMap = {};
const wildcardMap = {};

for (const row of records) {
  if (!row['KWSS URL'] || !row['KWH URL']) continue;

  const fromPath = new URL(row['KWSS URL']).pathname;
  const toPath = new URL(row['KWH URL']).pathname;

  // Normalize
  const normalizedFrom = fromPath.replace(/\/$/, '');

  if (normalizedFrom.endsWith('*')) {
    // Handle *.html* or similar
    const base = normalizedFrom.replace(/\*$/, '');
    wildcardMap[base] = toPath;
  } else {
    exactMap[normalizedFrom] = toPath;
  }
}

fs.writeFileSync(
  'redirect-map.json',
  JSON.stringify(exactMap, null, 2)
);

console.log(
  `Exact: ${Object.keys(exactMap).length}, Wildcards: ${Object.keys(wildcardMap).length}`
);