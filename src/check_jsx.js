import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Let's do a token-based stack check for tags: div, motion.div, AnimatePresence, main, modal, etc.
// Or even simpler, let's use regex to find all opening and closing tags and track them.
let regex = /<\/?([a-zA-Z0-9\.]+)(\s|>|\/)/g;
let match;
let stack = [];

let lines = content.split('\n');

for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
  let line = lines[lineNum - 1];
  let tagRegex = /<\/?([a-zA-Z0-9\.]+)/g;
  let m;
  while ((m = tagRegex.exec(line)) !== null) {
    let fullTag = m[0];
    let tagName = m[1];
    if (fullTag.startsWith('</')) {
      // Closing tag
      if (stack.length === 0) {
        console.log(`Line ${lineNum}: Unexpected closing tag </${tagName}> when stack is empty`);
      } else {
        let last = stack.pop();
        if (last.tagName !== tagName) {
          console.log(`Line ${lineNum}: Mismatched closing tag </${tagName}>. Expected </${last.tagName}> opened at line ${last.lineNum}`);
          // Put back if we want to continue or push back
          stack.push(last);
        }
      }
    } else if (!fullTag.endsWith('/')) {
      // Opening tag (ignoring self-closing like <div ... />)
      // Check if line has self-closing /> at the end of the tag
      // For simplicity, check if the tag match is followed by />
      let idx = m.index;
      let rest = line.substring(idx);
      let closeAngle = rest.indexOf('>');
      if (closeAngle !== -1 && rest[closeAngle - 1] === '/') {
        // Self-closing, skip
        continue;
      }
      stack.push({ tagName, lineNum });
    }
  }
}

console.log('Remaining unclosed tags in stack:');
stack.forEach(s => console.log(`- <${s.tagName}> opened at line ${s.lineNum}`));
