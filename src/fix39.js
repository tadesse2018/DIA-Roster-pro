import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("})()") && lines[i-1] && lines[i-1].includes(")")) {
    console.log(`Found suspect lines at ${i}:`, lines[i-1], lines[i]);
    lines[i-1] = "                         )}";
    lines[i] = "";
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Processed in fix39.js');
