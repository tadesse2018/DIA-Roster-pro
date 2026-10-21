const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

lines.splice(4275, 0, '                          className={`flex-1 min-w-[130px] py-2.5 px-3.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.03] ${');

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
