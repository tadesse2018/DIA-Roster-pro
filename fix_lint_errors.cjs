const fs = require('fs');

let lintOutput = '';
try {
  lintOutput = fs.readFileSync('lint_output.txt', 'utf8');
} catch (e) {
  console.error("No lint_output.txt found");
  process.exit(1);
}

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

const regex = /src\/App\.tsx\((\d+),\d+\):\s*error\s*(TS1127|TS1005|TS1003|TS1381|TS17002|TS2657)/g;
let match;
let linesToFix = new Set();

while ((match = regex.exec(lintOutput)) !== null) {
  let lineNum = parseInt(match[1]);
  // The error is often because the PREVIOUS line is missing '>'
  // Or the line itself. Let's look at lineNum - 1.
  let prevLineIdx = lineNum - 2; // -1 for 0-index, -1 for previous line
  let currLineIdx = lineNum - 1;
  
  if (prevLineIdx >= 0) {
    let prevLine = lines[prevLineIdx];
    // if prevLine ends with " or } or ' or )
    if (/[}"'\)]\s*$/.test(prevLine)) {
       // It's likely missing >
       linesToFix.add(prevLineIdx);
    }
  }
}

let changes = 0;
for (let idx of linesToFix) {
  lines[idx] = lines[idx].replace(/\s*$/, '>');
  changes++;
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Fixed', changes, 'lines by appending >');
