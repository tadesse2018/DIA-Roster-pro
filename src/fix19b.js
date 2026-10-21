import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

// Insert <> at line 5968 (before grid div)
if (lines[5967] && lines[5967].includes("parentSubView === 'attendance'")) {
  lines.splice(5968, 0, '                                     <>');
}

// Find `})()` around line 6146 and insert `</>` after it
for (let i = 6140; i < 6155; i++) {
  if (lines[i] && lines[i].includes('})()')) {
    lines.splice(i + 1, 0, '                                     </>');
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Done fix19b.js');
