const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

let tags = [];
let idx = 0;
while(idx < content.length) {
  let open = content.indexOf('<', idx);
  if (open === -1) break;
  // very naive, just to see what fails
  idx = open + 1;
}
console.log('Use a proper parser');
