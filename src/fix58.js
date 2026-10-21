import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === ');' && lines[i+1] && lines[i+1].includes('})()') && i > 5930 && i < 5960) {
    lines[i] = '                         )';
    console.log('Removed trailing semicolon at line', i+1);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix58.js');
