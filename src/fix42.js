import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

let iifeLineNums = [5523, 5926, 8924, 9124, 9216, 9408];

for (let lineNum of iifeLineNums) {
  let idx = lineNum - 1;
  if (lines[idx] && lines[idx].includes('})()') && !lines[idx].includes('})()}')) {
    lines[idx] = lines[idx].replace('})()', '})()}');
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Added closing brace to IIFEs in fix42.js');
