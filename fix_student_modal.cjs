const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

let start = content.indexOf('id="student-id-card"');
let end = content.indexOf('{/* Modal Controls', start);
console.log(content.substring(start, end));
