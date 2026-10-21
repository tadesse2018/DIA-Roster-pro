import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Remove line 5956 (the stray </motion.div>)
if (lines[5955] && lines[5955].includes('</motion.div>')) {
  lines.splice(5955, 1);
  console.log('Removed stray </motion.div> at line 5956');
}

// 2. Clean up around line 8629-8630
for (let i = 8625; i < 8635; i++) {
  if (lines[i] && lines[i].includes('</AnimatePresence>') && lines[i+1] && lines[i+1].includes('</AnimatePresence>')) {
    lines.splice(i+1, 1);
    console.log('Removed duplicate </AnimatePresence> around line', i+2);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix83.js');
