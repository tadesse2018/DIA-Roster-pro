import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

let stack = [];

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  // Find tags
  let tagRegex = /<\/?([a-zA-Z0-9\.]+)(\s|>|\/)/g;
  let m;
  while ((m = tagRegex.exec(line)) !== null) {
    let full = m[0];
    let name = m[1];
    let isClosing = full.startsWith('</');
    let isSelfClosing = full.endsWith('/') || line.substring(m.index).includes('/>'); // simplified

    // Check if self-closing in current tag snippet
    let sub = line.substring(m.index);
    let gt = sub.indexOf('>');
    let isSelf = gt !== -1 && sub[gt - 1] === '/';

    if (isClosing) {
      if (stack.length > 0) {
        let top = stack.pop();
        if (top.name !== name) {
          // Mismatch
          // Let's see if name matches anything further down in stack
          let foundIdx = stack.findIndex(s => s.name === name);
          if (foundIdx !== -1) {
            // Pop everything above it
            // console.log(`Line ${i+1}: Mismatch closing </${name}>, popped ${stack.length - foundIdx} items (top was <${top.name}> opened at line ${top.line})`);
            stack.length = foundIdx; // pop it and items above
          } else {
            // Stray closing tag
            // console.log(`Line ${i+1}: Stray closing tag </${name}>`);
          }
        }
      }
    } else if (!isSelf) {
      stack.push({ name, line: i + 1 });
    }
  }
}

console.log('Final stack size:', stack.length);
stack.slice(-20).forEach(s => console.log(`- <${s.name}> opened at line ${s.line}`));
