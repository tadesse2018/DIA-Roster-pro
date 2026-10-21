import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

// Change line 5968 from <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> to <div className="space-y-6">
// And insert <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> at line 5969
if (lines[5968] && lines[5968].includes('grid grid-cols-1 md:grid-cols-2 gap-6')) {
  lines[5968] = '                                     <div className="space-y-6">';
  lines.splice(5969, 0, '                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">');
}

// Find `})()` around line 6146 and add `</div>` after it
for (let i = 6140; i < 6152; i++) {
  if (lines[i] && lines[i].includes('})()')) {
    lines.splice(i + 1, 0, '                                     </div>');
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Done fix21.js');
