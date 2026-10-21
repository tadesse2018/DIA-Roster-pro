const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
let changed = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '<') {
    lines[i] = lines[i] + '>';
    changed++;
  } else if (lines[i].trim() === '</') {
    lines[i] = lines[i] + '>';
    changed++;
  }
}
fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Fixed ' + changed + ' fragments.');
