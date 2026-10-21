const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for(let i=3868; i<=3880; i++) {
  console.log(i, lines[i]);
}
