const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Remove the aggressive universal text color inside tables
css = css.replace(/\.dark table:not\(\.marklist-printable-table\):not\(\.roster-printable-table\) \* \{\s*color: #0f172a !important;\s*\}/g, '');

// Don't force text color on table, th, td
css = css.replace(/  background-color: #ffffff !important;\s*color: #0f172a !important;/g, '  background-color: #ffffff !important;');

// Add a global bold rule at the end if not present
if (!css.includes('font-weight: 800 !important;')) {
    css += '\n* {\n  font-weight: 800 !important;\n}\n';
} else {
    // If it's already there, replace any other font weights
    css = css.replace(/\* \{\s*font-weight: 800 !important;\s*\}/g, '');
    css += '\n* {\n  font-weight: 800 !important;\n}\n';
}

fs.writeFileSync('src/index.css', css, 'utf8');
console.log("Fixed CSS overrides and added global bold");
