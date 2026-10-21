import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 8625; i < 8635; i++) {
  if (lines[i] && lines[i].includes('</AnimatePresence>') && lines[i+1] && lines[i+1].includes('document.body')) {
    if (!lines[i].endsWith(',')) {
      lines[i] = lines[i] + ',';
      console.log('Added comma to line', i+1);
    }
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix84.js');
