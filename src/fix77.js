import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

console.log('Line 10126:', JSON.stringify(lines[10125]));
if (lines[10125].includes('motion.div')) {
  lines.splice(10125, 1);
  console.log('Removed line 10126 successfully.');
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
