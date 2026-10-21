import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Quick entry IIFE ends with `</div>\n                          )}`
let target = `                           </div>
                          )}`;

let replacement = `                           </div>
                         );
                       })()}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  console.log('Replaced quick-entry IIFE ending correctly');
} else {
  console.log('Target for quick-entry IIFE ending not found');
}

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Saved fix52.js');
