const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/className="w-\[240px\] h-\[380px\] shrink-0 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden border border-stone-300 shadow-xl text-center select-none bg-white"/g, 'className="w-[240px] h-[380px] shrink-0 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden border-4 border-indigo-600/20 shadow-xl text-center select-none bg-white"');

content = content.replace(/className="w-\[240px\] h-\[380px\] shrink-0 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden border border-stone-300 shadow-2xl text-center select-none bg-white"/g, 'className="w-[240px] h-[380px] shrink-0 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden border-4 border-indigo-600/20 shadow-2xl text-center select-none bg-white"');

fs.writeFileSync('src/App.tsx', content);
