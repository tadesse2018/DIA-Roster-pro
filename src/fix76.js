import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '</motion.div>' && i > 10120) {
    lines.splice(i, 1);
    console.log('Removed stray </motion.div> at line', i+1);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix76.js');
