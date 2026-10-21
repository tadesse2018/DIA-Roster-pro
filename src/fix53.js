import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('</div') && lines[i+1] && lines[i+1].includes(')}')) {
    // Check if this is the quick-entry IIFE end
    if (i > 5500 && i < 5700) {
      lines[i+1] = '                         );\n                       })()';
      console.log('Replaced quick-entry IIFE end at line', i+1);
      break;
    }
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix53.js');
