import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace("          </AnimatePresence>\n", "");

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Successfully removed stray AnimatePresence in fix37.js');
