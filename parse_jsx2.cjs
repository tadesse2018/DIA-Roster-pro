const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');
let stack = [];
let lines = content.split('\n');

for (let i = 3500; i < 3700; i++) {
    let line = lines[i];
    if (!line) continue;
    if (line.includes('<main')) {
        console.log(`${i+1}: ${line}`);
    }
}
