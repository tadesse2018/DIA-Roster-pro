const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

let idx = content.indexOf('map((student');
console.log(content.substring(idx, idx + 500));
