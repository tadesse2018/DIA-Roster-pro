import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

for (let i = 10485; i < 10500; i++) {
  if (lines[i] && lines[i].includes('</div>') && lines[i-1] && lines[i-1].includes('})()')) {
    lines.splice(i + 1, 0, '              )}');
    lines.splice(i + 2, 0, '              </>');
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Done fix17.js');
