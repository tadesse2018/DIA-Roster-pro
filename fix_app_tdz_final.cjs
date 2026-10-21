const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
let changed = 0;
for (let i = 0; i < lines.length - 1; i++) {
  let line = lines[i];
  let nextLine = lines[i+1].trim();
  
  if (line.endsWith('"') || line.endsWith("'") || line.endsWith('}')) {
    if (nextLine.startsWith('<') && !nextLine.startsWith('</')) {
      lines[i] = line + '>';
      changed++;
    } else if (nextLine.startsWith('{') && !nextLine.includes('=')) {
      lines[i] = line + '>';
      changed++;
    }
  }
}
fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Fixed ' + changed + ' attribute endings.');
