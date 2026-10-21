import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 5945; i < 5955; i++) {
  if (lines[i] && lines[i].includes(')') && lines[i+1] && lines[i+1].includes(')}')) {
    lines[i] = '';
    lines[i+1] = '                       )}';
    console.log('Fixed parentSearched closing at line', i+1);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix61.js');
