import fs from 'fs';
import { parse } from 'csv-parse/sync';

const csv = fs.readFileSync(
  'redirects.csv'
);

const records = parse(csv, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  relax_quotes: true,
  escape: '"',
  quote: '"'
});

const exactMap = {};
const wildcardMap = {};
let skippedCount = 0;
let errorCount = 0;

for (let i = 0; i < records.length; i++) {
  const row = records[i];
  const rowNumber = i + 2; // +2 because array is 0-indexed and CSV has header
  
  // Skip if either URL is missing or empty
  if (!row['KWSS URL'] || !row['KWH URL'] || 
      row['KWSS URL'].trim() === '' || row['KWH URL'].trim() === '') {
    console.log(`Row ${rowNumber}: Skipping - missing URL(s)`);
    skippedCount++;
    continue;
  }

  try {
    const fromPath = new URL(row['KWSS URL'].trim()).pathname;
    const toUrl = row['KWH URL'].trim();
    
    // For destination, keep the full URL but clean it up
    let toPath;
    if (toUrl.startsWith('http')) {
      toPath = toUrl;
    } else if (toUrl.startsWith('www.')) {
      toPath = 'https://' + toUrl;
    } else {
      toPath = toUrl;
    }

    // Normalize the from path
    const normalizedFrom = fromPath.replace(/\/$/, '');

    if (normalizedFrom.endsWith('*')) {
      // Handle wildcard redirects
      const base = normalizedFrom.replace(/\*$/, '');
      wildcardMap[base] = toPath;
    } else {
      exactMap[normalizedFrom] = toPath;
    }
  } catch (error) {
    console.log(`Row ${rowNumber}: Error parsing URLs - ${error.message}`);
    console.log(`  KWSS URL: ${row['KWSS URL']}`);
    console.log(`  KWH URL: ${row['KWH URL']}`);
    errorCount++;
  }
}

// Combine both exact and wildcard maps
const combinedMap = { ...exactMap, ...wildcardMap };

fs.writeFileSync(
  'redirect-map.json',
  JSON.stringify(combinedMap, null, 2)
);

console.log(`\nProcessing Summary:`);
console.log(`Total rows in CSV: ${records.length}`);
console.log(`Exact redirects: ${Object.keys(exactMap).length}`);
console.log(`Wildcard redirects: ${Object.keys(wildcardMap).length}`);
console.log(`Total redirects: ${Object.keys(combinedMap).length}`);
console.log(`Skipped (missing URLs): ${skippedCount}`);
console.log(`Errors (invalid URLs): ${errorCount}`);
console.log(`Unprocessed: ${records.length - Object.keys(combinedMap).length - skippedCount - errorCount}`);