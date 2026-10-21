import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

let target = '{/* Parent search results canvas */}';
let replacement = '</div>\n\n                      {/* Parent search results canvas */}';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Inserted missing closing div for lg:col-span-4');
} else {
  console.log('Target not found');
}
