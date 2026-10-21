import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('})()') && lines[i+2] && lines[i+2].trim() === '</div>') {
    console.log('Removing extra </div> at line', i + 3);
    lines[i+2] = '';
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Done fix5.js');
