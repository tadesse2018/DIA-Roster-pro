import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('whitelabel')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
