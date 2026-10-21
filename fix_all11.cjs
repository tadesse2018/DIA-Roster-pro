const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

let idx = content.indexOf('Printable ID Card');
console.log(content.substring(idx - 500, idx + 500));
