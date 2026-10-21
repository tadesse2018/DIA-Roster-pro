import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('})()') && lines[i+1] && lines[i+1].trim() === '</div>') {
    console.log('Removing extra </div> at line', i + 2);
    lines[i+1] = '';
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
