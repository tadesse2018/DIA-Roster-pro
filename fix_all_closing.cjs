const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/<\/([a-zA-Z0-9\.]+)\s*$/gm, '</$1>');
fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Fixed all closing tags');
