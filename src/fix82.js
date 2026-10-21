import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 8620; i < 8632; i++) {
  if (lines[i] && lines[i].trim() === ')}') {
    lines.splice(i + 1, 0, '        </AnimatePresence>');
    console.log('Inserted main </AnimatePresence> at line', i+2);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix82.js');
