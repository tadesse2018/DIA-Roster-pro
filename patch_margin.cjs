const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/mt-2.5 flex flex-col items-center justify-center/g, 'mt-1 flex flex-col items-center justify-center');
code = code.replace(/mt-5 mb-1 flex flex-col/g, 'mt-2 flex flex-col');
code = code.replace(/mt-4 flex flex-col items-center/g, 'mt-2 flex flex-col items-center');

fs.writeFileSync('src/App.tsx', code);
console.log('Margins updated');
