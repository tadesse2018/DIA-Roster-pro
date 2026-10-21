import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove the premature </AnimatePresence> at line 5948
content = content.replace("                          )}\n                         </AnimatePresence>\n                       </div>", "                          )}\n                       </div>");

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Successfully removed premature AnimatePresence close in fix36.js');
