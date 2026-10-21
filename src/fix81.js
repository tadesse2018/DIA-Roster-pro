import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Clean up any stray fix80 insertion
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '</AnimatePresence>' && i > 8620 && i < 8635) {
    // check if next line is also </AnimatePresence>
    if (lines[i+1] && lines[i+1].trim() === '</AnimatePresence>,') {
      lines.splice(i, 1);
      console.log('Removed duplicate AnimatePresence at line', i+1);
      break;
    }
  }
}

// Now find where report-tab ends (around line 8628) and close the main AnimatePresence (opened at line 3536)
for (let i = 8620; i < 8635; i++) {
  if (lines[i] && lines[i].trim() === ')}' && lines[i-1].includes('motion.div')) {
    lines.splice(i + 1, 0, '        </AnimatePresence>');
    console.log('Inserted main </AnimatePresence> at line', i+2);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix81.js');
