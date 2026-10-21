const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

let loopStart = content.indexOf('students.map((student, index) => (');
console.log(content.substring(loopStart, loopStart + 800));
