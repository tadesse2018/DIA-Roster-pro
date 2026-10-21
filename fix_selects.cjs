const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/ value=\{\(window as any\)\._passwordsRoleFilter \|\| 'all'\}/g, '');
fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Removed wrong values');
