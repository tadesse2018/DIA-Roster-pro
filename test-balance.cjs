const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

let lines = content.split('\n');

let stack = [];
let re = /<\/?([a-zA-Z0-9\.]+)[^>]*>/g;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // ignore comments roughly
  if (line.includes('{/*') && line.includes('*/}')) {
    line = line.replace(/\{\/\*.*?\*\/\}/g, '');
  }
  
  let m;
  while(m = re.exec(line)) {
    let tag = m[1];
    let isClose = m[0].startsWith('</');
    let isSelfClose = m[0].endsWith('/>');
    if (isSelfClose) continue;
    
    if (!isClose) {
      stack.push({tag, line: i + 1});
    } else {
      if (stack.length === 0) {
        console.log('UNEXPECTED CLOSE:', tag, 'at line', i + 1);
      } else {
        let top = stack.pop();
        if (top.tag !== tag) {
          console.log('MISMATCH:', top.tag, '(opened at', top.line + ') closed by', tag, 'at line', i + 1);
          // try to recover stack
          if (stack.length > 0 && stack[stack.length - 1].tag === tag) {
             stack.pop(); // assume top was just missing a close
          }
        }
      }
    }
  }
}
console.log('Remaining on stack:', stack.length);
