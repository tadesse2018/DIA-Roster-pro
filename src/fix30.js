import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

let targetIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('ብዛት፡ {history.length} ቀናት')) {
    targetIdx = i;
    break;
  }
}

console.log('Found orphaned history length span at line:', targetIdx);

if (targetIdx !== -1) {
  // Remove lines targetIdx-1 to targetIdx+3
  lines.splice(targetIdx - 1, 6);
  fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
  console.log('Successfully removed orphaned lines via fix30.js');
} else {
  console.log('Target not found for fix30.js');
}
