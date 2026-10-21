const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
let changed = 0;
for (let i = 0; i < lines.length - 1; i++) {
  let line = lines[i].trimEnd();
  
  if (line.endsWith('"') || line.endsWith("'") || line.endsWith('}') || line.endsWith('true') || line.endsWith('false') || line.endsWith('null') || line.match(/[a-zA-Z0-9]+$/)) {
    // Look for the next non-empty line
    let nextLine = '';
    for (let j = i + 1; j < lines.length; j++) {
      let t = lines[j].trim();
      if (t !== '') {
        nextLine = t;
        break;
      }
    }
    
    // If it looks like a tag was unclosed...
    if (nextLine.startsWith('<') && !nextLine.startsWith('</')) {
      if (!lines[i].endsWith('>')) {
        // But wait, what if line is just an attribute like `disabled` or `value="x"` inside an open tag?
        // If it was inside an open tag, it WOULD have ended with `>` if it was the last attribute on the line.
        // Because `sed` removed `>` at the end of the line.
        // Wait! `sed s/>$//` ONLY removed `>` if it was exactly at the end of the line.
        // So any line that is missing a `>` MUST have ended with `>`.
        lines[i] = line + '>';
        changed++;
      }
    } else if (nextLine.startsWith('{') && !nextLine.includes('=')) {
      if (!lines[i].endsWith('>')) {
        lines[i] = line + '>';
        changed++;
      }
    }
  }
}
fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Fixed ' + changed + ' smart attribute endings.');
