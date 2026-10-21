import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

let target = `                                           </>,`;
let replacement = `                                           </>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Removed trailing comma from fragment in fix18.js');
} else {
  console.log('Target not found for fix18.js');
}
