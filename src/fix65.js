import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Fix modal AnimatePresence around line 7191-7304
// Let's replace lines 7191 to 7304 with clean structure
for (let i = 7190; i < 7306; i++) {
  if (lines[i] && lines[i].includes('selectedDefect &&')) {
    // Found the modal block start
    // Let's ensure AnimatePresence wraps selectedDefect correctly
    lines[i-1] = '               {selectedDefect && (';
    lines[i] = '                 <AnimatePresence>';
    break;
  }
}

// Find line 7303/7304 where </AnimatePresence> and )} are
for (let i = 7298; i < 7308; i++) {
  if (lines[i] && lines[i].includes('</AnimatePresence>')) {
    lines[i] = '                 </AnimatePresence>';
    if (lines[i+1]) {
      lines[i+1] = '               )}';
    }
    break;
  }
}

// 2. Fix line 9131 IIFE closing brace
for (let i = 9125; i < 9135; i++) {
  if (lines[i] && lines[i].includes('); })()')) {
    lines[i] = '                          ); })()}';
    console.log('Fixed IIFE closing brace at line', i+1);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix65.js');
