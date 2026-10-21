import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

if (lines[7302] && lines[7302].includes('</motion.div>')) {
  lines[7302] = '              </AnimatePresence>';
  console.log('Fixed line 7303 to </AnimatePresence>');
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix64.js');
