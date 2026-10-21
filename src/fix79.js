import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '      </main>',
  '        </AnimatePresence>\n      </main>'
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Saved fix79.js');
