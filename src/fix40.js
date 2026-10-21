import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Restore })() for IIFEs
let iifeLines = [5522, 5926, 8924, 9124, 9216, 9408];
for (let lineNum of iifeLines) {
  if (lines[lineNum - 1] && lines[lineNum - 1].includes(")}")) {
    lines[lineNum - 1] = lines[lineNum - 1].replace(")}", "})()");
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Restored IIFEs in fix40.js');
