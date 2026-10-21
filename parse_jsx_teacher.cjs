const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
let idx = content.indexOf('className="qr-card-container');
let str = content.substring(idx - 100, idx + 1000);
console.log(str.length);
