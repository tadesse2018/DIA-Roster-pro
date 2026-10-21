const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

let start = content.indexOf('<React.Fragment key={index}>');
console.log(content.substring(start, start + 1000));
