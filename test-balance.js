const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// We will find `<AnimatePresence>` at 9441.
let lines = content.split('\n');
let openCount = 0;
let stack = [];

// Very naive stack tracer
for(let i=9440; i<10252; i++) {
  let l = lines[i];
  let opens = l.match(/<[a-zA-Z]+/g) || [];
  let closes = l.match(/<\/[a-zA-Z]+/g) || [];
  let selfcloses = l.match(/\/>/g) || [];
  
  // subtract self closes from opens
  // Actually, better to just use a regex scanner over the whole text from 9441 to 10252
}
