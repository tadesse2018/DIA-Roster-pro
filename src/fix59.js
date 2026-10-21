import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace parent workspace end pattern
content = content.replace(
  /                          \)\n                       \}\)\(\)/g,
  '                      )'
);

// Replace whitelabel tab end pattern if any similar
content = content.replace(
  /                          \);\n                        \}\)\(\)/g,
  '                      )'
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Saved fix59.js and updated App.tsx');
