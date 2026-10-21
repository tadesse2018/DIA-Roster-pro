const fs = require('fs');

let lintOutput = '';
try {
  lintOutput = fs.readFileSync('lint_output.txt', 'utf8');
} catch (e) {
  process.exit(1);
}

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

const regex = /src\/App\.tsx\((\d+),\d+\):\s*error\s*(TS1127|TS1005|TS1003|TS1381|TS17002|TS2657)/g;
let match;
let linesToFix = new Set();
let manualRemovals = []; // to remove incorrectly added >

while ((match = regex.exec(lintOutput)) !== null) {
  let lineNum = parseInt(match[1]);
  let lineIdx = lineNum - 1;
  
  // if the error line itself has an incorrectly added > at the end (like `}>` or `]>`), 
  // maybe we added it by mistake in the previous run?
  if (/>$/.test(lines[lineIdx]) && !lines[lineIdx].includes('<')) {
     lines[lineIdx] = lines[lineIdx].replace(/>$/, '');
  }

  // search upwards for the end of a JSX open tag
  let found = false;
  for (let i = lineIdx; i >= Math.max(0, lineIdx - 10); i--) {
    let l = lines[i];
    // if the line ends with an attribute value (quote or brace) and no >
    if (/[}"'\)]\s*$/.test(l) && !l.includes('/>') && !l.trim().startsWith('//')) {
      // confirm there's an open tag somewhere before this that hasn't been closed
      linesToFix.add(i);
      found = true;
      break;
    }
  }
}

let changes = 0;
for (let idx of linesToFix) {
  if (!lines[idx].trim().endsWith('>')) {
    lines[idx] = lines[idx].replace(/\s*$/, '>');
    changes++;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Fixed', changes, 'lines by appending >');
