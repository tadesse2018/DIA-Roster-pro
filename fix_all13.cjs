const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
let idx = content.indexOf('</React.Fragment>');
console.log(content.substring(idx - 3500, idx - 1500));
