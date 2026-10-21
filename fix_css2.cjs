const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Replace the forced white table backgrounds in dark mode
// We'll only target td for white background, not th or table
css = css.replace(
  /\.dark table:not\(\.marklist-printable-table\):not\(\.roster-printable-table\),\s*\.dark table:not\(\.marklist-printable-table\):not\(\.roster-printable-table\) th,\s*\.dark table:not\(\.marklist-printable-table\):not\(\.roster-printable-table\) td \{/g,
  '.dark table:not(.marklist-printable-table):not(.roster-printable-table) td {'
);

fs.writeFileSync('src/index.css', css, 'utf8');
console.log("Removed forced white background from table and th in dark mode");
