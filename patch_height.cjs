const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/w-\[285px\] h-\[460px\]/g, 'w-[285px] h-[485px]');
code = code.replace(/height: '115mm'/g, "height: '125mm'");
code = code.replace(/height: 120mm !important;/g, "height: 128mm !important;");

code = code.replace(/className="w-32 h-32"/g, 'className="w-28 h-28"'); // scale down qr slightly to fit signature
fs.writeFileSync('src/App.tsx', code);
console.log('Heights updated');
