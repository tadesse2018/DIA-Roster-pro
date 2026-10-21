import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

let lineNums = [8925, 9125, 9217, 9409];
for (let lineNum of lineNums) {
  let idx = lineNum - 1;
  if (lines[idx] && lines[idx].includes('})()')) {
    lines[idx] = lines[idx].replace('})()', '); })()');
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Fixed IIFEs in fix44.js');
