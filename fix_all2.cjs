const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

let start = content.indexOf('{/* Printable ID Card */}');
let end = content.indexOf('{/* BACK CARD */}', start);
console.log(content.substring(end - 300, end + 50));
