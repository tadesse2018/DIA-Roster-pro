const fs = require('fs');

let lintOutput = fs.readFileSync('lint_output.txt', 'utf8');
let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

const regex = /src\/App\.tsx\((\d+),\d+\):\s*error\s*(TS1005|TS1382|TS17002|TS17015|TS1127|TS1381|TS1003)/g;
let match;
let toFix = new Set();
let changes = 0;

while ((match = regex.exec(lintOutput)) !== null) {
  let lineNum = parseInt(match[1]);
  let lineIdx = lineNum - 1;
  let errorType = match[2];
  
  if (errorType === 'TS1005' && lines[lineIdx].includes('}>')) { // '...' expected (meaning it saw }> where it expected a tag or something)
     lines[lineIdx] = lines[lineIdx].replace('}>', '}');
     if (lines[lineIdx - 1] && !lines[lineIdx - 1].trim().endsWith('>')) {
       lines[lineIdx - 1] = lines[lineIdx - 1].replace(/\s*$/, '>');
     }
     changes++;
  }
  if (errorType === 'TS1382' && lines[lineIdx].includes('}>')) {
     lines[lineIdx] = lines[lineIdx].replace('}>', '}');
     changes++;
  }
  // Let's just do a generic sweep:
  // anywhere we see }>, if it's not `/>`, just make it `}` and ensure the previous line ends with `>` if it has className etc.
}

for (let i = 4000; i < lines.length; i++) {
   if (lines[i].match(/^\s*[^<]*\}>$/)) {
      lines[i] = lines[i].replace('}>', '}');
      if (lines[i-1] && lines[i-1].includes('className=') && !lines[i-1].includes('>')) {
         lines[i-1] = lines[i-1].replace(/\s*$/, '>');
      }
      changes++;
   }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Fixed', changes, 'lines');
