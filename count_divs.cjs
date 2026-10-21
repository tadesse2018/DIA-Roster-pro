const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
let divCount = 0;
for (let i = 10000; i < 10250; i++) {
  let line = lines[i];
  let opens = (line.match(/<div/g) || []).length;
  let closes = (line.match(/<\/div>/g) || []).length;
  divCount += opens - closes;
  if (opens !== closes) {
    console.log(i + ' | net ' + (opens - closes) + ' | cur ' + divCount + ' : ' + line.trim());
  }
}
