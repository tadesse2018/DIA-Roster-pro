const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<th className="p-3 text-slate-600 dark:text-slate-300">ዕድሜ</th>`;
const replacement = `<th className="p-3 text-black dark:text-black bg-white dark:bg-white font-black">ዕድሜ</th>`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code, 'utf8');
    console.log("Successfully replaced header");
} else {
    console.log("Not found exact match for header");
}
