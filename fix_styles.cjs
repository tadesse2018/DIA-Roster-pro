const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

if (!code.includes('* { font-weight: bold !important; }')) {
  code += '\n\n* {\n  font-weight: 800 !important;\n}\n';
}

code = code.replace(
  'input, select, textarea, label, button {\n  font-weight: 800 !important;\n}',
  ''
);

fs.writeFileSync('src/index.css', code, 'utf8');
console.log("Updated index.css");
