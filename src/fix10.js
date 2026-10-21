import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

for (let i = 6365; i <= 6375 && i < lines.length; i++) {
  if (lines[i].includes(') : null}')) {
    console.log('Removing lines[i]:', lines[i]);
    lines[i] = '';
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Done fix10.js');
