import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('                       })()') && i > 5580 && i < 5610) {
    lines[i] = '                       })()}';
    console.log('Added closing } to quick-entry IIFE at line', i+1);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix55.js');
