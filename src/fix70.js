import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 9405; i < 9418; i++) {
  if (lines[i] && lines[i].includes('); })()')) {
    lines[i] = '                          ); })()}';
    console.log('Fixed IIFE closing brace at line', i+1);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix70.js');
