import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove the stray </AnimatePresence> before </main>
content = content.replace("          </AnimatePresence>\n       </main>", "       </main>");

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Successfully removed stray </AnimatePresence> in fix35.js');
