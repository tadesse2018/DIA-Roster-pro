import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 7300; i < 7306; i++) {
  if (lines[i] && lines[i].includes('</motion.div>') && lines[i-1] && lines[i-1].includes(')}')) {
    lines[i] = '               </AnimatePresence>';
    console.log('Replaced stray </motion.div> with </AnimatePresence> at line', i+1);
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix63.js');
