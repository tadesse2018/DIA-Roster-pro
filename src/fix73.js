import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '      </main>',
  '        </motion.div>\n      </main>'
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Saved fix73.js');
