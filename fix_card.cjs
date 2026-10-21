const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Find all occurrences of h-[105px] or h-[100px] in the ID card headers and increase them.
let res1 = content.match(/h-\[105px\]/g);
let res2 = content.match(/h-\[100px\]/g);
console.log("Found h-[105px]:", res1 ? res1.length : 0);
console.log("Found h-[100px]:", res2 ? res2.length : 0);

