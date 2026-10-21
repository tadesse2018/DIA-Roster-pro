const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The loop starts with `students.map`
let loopStart = content.indexOf('students.map((student, index) => (');
let loopEnd = content.indexOf('</React.Fragment>', loopStart);

// Let's see the end of the loop
console.log(content.substring(loopEnd - 500, loopEnd + 150));
