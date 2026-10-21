const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

let start = content.indexOf('{/* Printable ID Card */}');
let firstOcc = content.substring(start - 500, start + 1000);
console.log('--- FIRST OCCURRENCE (Print All?) ---');
console.log(firstOcc);

start = content.indexOf('{/* Printable ID Card */}', start + 1);
let secondOcc = content.substring(start - 500, start + 1000);
console.log('\n--- SECOND OCCURRENCE (Modal?) ---');
console.log(secondOcc);
