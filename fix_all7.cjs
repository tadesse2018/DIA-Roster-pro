const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

console.log(content.indexOf('id="print-qr-modal"'));
console.log(content.indexOf('id="print-teacher-qr-modal"'));
