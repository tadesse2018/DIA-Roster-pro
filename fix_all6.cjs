const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
let printAll = content.indexOf('const handlePrintAll');
console.log('handlePrintAll found at:', printAll);
let portalPrint = content.indexOf('print-all-modal');
console.log('print-all-modal found at:', portalPrint);
