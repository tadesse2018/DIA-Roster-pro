import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Fix modal AnimatePresence around line 7191-7304
for (let i = 7190; i < 7306; i++) {
  if (lines[i] && lines[i].includes('selectedDefect &&')) {
    lines[i-1] = '               <AnimatePresence>';
    lines[i] = '                 {selectedDefect && (';
    break;
  }
}

for (let i = 7298; i < 7306; i++) {
  if (lines[i] && lines[i].includes('</AnimatePresence>')) {
    lines[i] = '                 )}';
    if (lines[i+1]) {
      lines[i+1] = '               </AnimatePresence>';
    }
    break;
  }
}

// 2. Fix line 9223 IIFE closing brace
for (let i = 9218; i < 9228; i++) {
  if (lines[i] && lines[i].includes('); })()')) {
    lines[i] = '                          ); })()}';
    console.log('Fixed IIFE closing brace at line', i+1);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix66.js');
