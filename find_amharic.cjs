const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf8');

// Find all matches of > ... Amharic ... <
const matches = content.match(/>([^<]*[\u1200-\u137F][^<]*)</g);

if (matches) {
  const uniqueMatches = [...new Set(matches)];
  console.log(`Found ${uniqueMatches.length} unique text nodes with Amharic.`);
  console.log(uniqueMatches.slice(0, 20).join('\n'));
}

// Find all matches of '... Amharic ...' or "... Amharic ..."
// But exclude if it's already inside tx( or t(
const strMatches = content.match(/["']([^"']*[\u1200-\u137F][^"']*)["']/g);
if (strMatches) {
  const uniqueStrMatches = [...new Set(strMatches)];
  console.log(`Found ${uniqueStrMatches.length} unique strings with Amharic.`);
  console.log(uniqueStrMatches.slice(0, 20).join('\n'));
}
