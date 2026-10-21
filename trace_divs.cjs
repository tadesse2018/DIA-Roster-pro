const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');
let depth = 0;

for (let i = 3630; i < 9000; i++) {
    let line = lines[i];
    if (!line) continue;
    
    // Naive tag extraction
    let openMatch = line.match(/<div(\s|>)/g);
    let closeMatch = line.match(/<\/div>/g);
    
    let openCount = openMatch ? openMatch.length : 0;
    let closeCount = closeMatch ? closeMatch.length : 0;
    
    // Ignore self-closing divs <div ... />
    let selfClosing = (line.match(/<div[^>]*\/>/g) || []).length;
    openCount -= selfClosing;
    
    depth += openCount;
    depth -= closeCount;
    
    if (depth < 0) {
        console.log(`NEGATIVE DEPTH at line ${i+1}: ${line}`);
        break;
    }
}
console.log('Final depth:', depth);
