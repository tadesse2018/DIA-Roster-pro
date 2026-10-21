const fs = require('fs');

let lintOutput = fs.readFileSync('lint_output.txt', 'utf8');
let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

const regex = /src\/App\.tsx\((\d+),\d+\):\s*error\s*(TS1382)/g;
let match;
while ((match = regex.exec(lintOutput)) !== null) {
  let lineNum = parseInt(match[1]);
  let lineIdx = lineNum - 1;
  // Let's find the last '>' on this line and remove it.
  // Because if it's unexpected, it's just a rogue character.
  let line = lines[lineIdx];
  let lastGt = line.lastIndexOf('>');
  if (lastGt !== -1) {
     lines[lineIdx] = line.substring(0, lastGt) + line.substring(lastGt + 1);
  }
}
fs.writeFileSync('src/App.tsx', lines.join('\n'));
