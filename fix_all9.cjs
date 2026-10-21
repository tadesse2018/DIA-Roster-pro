const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

let loopStart = content.indexOf('map((student');
console.log('map((student: ' + loopStart);
let loopStart2 = content.indexOf('map(');
console.log('map(: ' + loopStart2);
