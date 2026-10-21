import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

// 1. At line 5968, change <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> to <><div className="grid grid-cols-1 md:grid-cols-2 gap-6">
if (lines[5968] && lines[5968].includes('grid grid-cols-1 md:grid-cols-2 gap-6')) {
  lines[5968] = '                                     <>\n                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">';
}

// 2. Remove line 6147 if it contains `</>`
for (let i = 6140; i < 6152; i++) {
  if (lines[i] && lines[i].trim() === '</>' && i > 6145) {
    lines.splice(i, 1);
    console.log('Removed extra fragment closing at line', i);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Done fix20.js');
