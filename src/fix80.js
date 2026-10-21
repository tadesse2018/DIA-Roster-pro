import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 8620; i < 8635; i++) {
  if (lines[i] && lines[i].trim() === ')}') {
    // Check if this is the end of report-tab
    lines.splice(i + 1, 0, '        </AnimatePresence>');
    console.log('Inserted </AnimatePresence> after line', i+1);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix80.js');
