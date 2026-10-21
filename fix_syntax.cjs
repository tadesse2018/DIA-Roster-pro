const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
let lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{isCaptchaVerified && <span className="text-[11px] font-black">✓</span>}>')) {
    lines[i] = lines[i].replace('}>', '}');
  }
  if (lines[i].includes('className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black transition-all shadow-md cursor-pointer"')) {
    if (!lines[i].includes('>')) {
       lines[i] = lines[i] + '>';
    }
  }
}
fs.writeFileSync('src/App.tsx', lines.join('\n'));
