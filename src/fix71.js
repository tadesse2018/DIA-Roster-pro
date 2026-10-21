import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 10115; i < lines.length; i++) {
  if (lines[i] && lines[i].includes('</AnimatePresence>') && i > 10118 && i < 10127) {
    lines[i] = '';
    console.log('Removed stray </AnimatePresence> at line', i+1);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix71.js');
