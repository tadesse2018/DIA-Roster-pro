const fs = require('fs');
let output = fs.readFileSync('lint_output.txt', 'utf8');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const regex = /src\/App\.tsx\((\d+),\d+\):\s*error\s*TS1382/g;
let match;
let changes = 0;

while ((match = regex.exec(output)) !== null) {
  let lineIdx = parseInt(match[1]) - 1;
  if (/>$/.test(lines[lineIdx]) && !lines[lineIdx].includes('<')) {
    lines[lineIdx] = lines[lineIdx].replace(/>$/, '');
    changes++;
  } else if (lines[lineIdx].endsWith('>')) {
    // maybe it has < but the > at the end is still wrong because it was appended by me
    // let's check if the line has unclosed tag? Or maybe just remove > if it ends with }>, )>, ">, '>, ]>
    if (/[}"'\)\]]>$/.test(lines[lineIdx]) && !lines[lineIdx].includes('/>') && !lines[lineIdx].includes('</')) {
      // It's tricky. Let's just remove the last > if it was added by us.
      lines[lineIdx] = lines[lineIdx].replace(/>$/, '');
      changes++;
    }
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Removed > from', changes, 'lines');
