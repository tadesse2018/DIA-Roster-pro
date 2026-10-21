import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'className="px-6 py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-semibold rounded-xl text-sm transition-all,',
  'className="px-6 py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-semibold rounded-xl text-sm transition-all"'
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Saved fix68.js');
