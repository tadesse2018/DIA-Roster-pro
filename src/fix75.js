import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('TAB 1.5: THE SAAS WHITE-LABEL')) {
    lines.splice(i, 0, '                    </motion.div>');
    console.log('Inserted </motion.div> at line', i+1);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix75.js');
