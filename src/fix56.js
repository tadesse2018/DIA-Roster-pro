import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('                          )()') && i > 5850 && i < 6000) {
    lines[i] = '                                             );\n                                           })()}';
    console.log('Fixed attendance IIFE ending at line', i+1);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix56.js');
