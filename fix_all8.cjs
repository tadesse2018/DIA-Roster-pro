const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

let loopStart = content.indexOf('students.map((student');
console.log(content.substring(loopStart, loopStart + 500));
