import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Line 5952 is `                       })()}`
if (lines[5951] && lines[5951].includes('})()')) {
  lines[5951] = '                      )}';
  console.log('Fixed line 5952');
}

// Line 6174-6175
for (let i = 6165; i < 6185; i++) {
  if (lines[i] && lines[i].includes('})()')) {
    lines[i] = '                      )}';
    console.log('Fixed line', i+1);
  }
  if (lines[i] && lines[i].trim() === ');') {
    lines[i] = '                      ';
    console.log('Cleared semicolon at line', i+1);
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix60.js');
