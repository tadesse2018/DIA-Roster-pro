const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// We'll write a small regex logic to see around 3946
console.log("Lines 3940-3960");
let lines = code.split('\n');
for (let i = 3940; i < 3960; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
