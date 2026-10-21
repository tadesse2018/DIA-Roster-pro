const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const lines = code.split('\n');

for (let i = 3538; i < 3550; i++) {
  console.log(i + 1, lines[i]);
}
for (let i = 3660; i < 3670; i++) {
  console.log(i + 1, lines[i]);
}
for (let i = 4110; i < 4120; i++) {
  console.log(i + 1, lines[i]);
}
