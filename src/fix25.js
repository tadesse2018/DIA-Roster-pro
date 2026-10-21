import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Let's find the exact chunk from line 5754 to 5941 and replace it with a clean attendance button.
let lines = content.split('\n');

let start = -1;
let end = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("setParentSubView('attendance')") && lines[i+1] && lines[i+1].includes('className={`px-4 py-2.5 text-xs font-black')) {
    start = i;
    break;
  }
}

if (start !== -1) {
  for (let i = start; i < lines.length; i++) {
    if (lines[i].trim() === '</div>' && lines[i+1] && lines[i+1].includes('lg:col-span-8')) {
      end = i;
      break;
    }
  }
}

console.log('start:', start, 'end:', end);

if (start !== -1 && end !== -1) {
  let replacement = [
    '                                     <button',
    '                                       type="button"',
    '                                       onClick={() => { playInteractiveSound(\'click\'); setParentSubView(\'attendance\'); }}',
    '                                       className={`px-4 py-2.5 text-xs font-black rounded-t-xl border-t border-x transition-all -mb-px shrink-0 ${',
    '                                         parentSubView === \'attendance\'',
    '                                           ? \'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-indigo-600 dark:text-indigo-400 border-b-white dark:border-b-stone-900 z-10\'',
    '                                           : \'bg-stone-50/60 dark:bg-stone-950/40 border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100/60 dark:hover:bg-stone-900/40\'',
    '                                       }`}',
    '                                     >',
    '                                       📅 አቴንዳንስና ምግባር (Attendance)',
    '                                     </button>'
  ];

  lines.splice(start, end - start + 1, ...replacement);
  fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
  console.log('Successfully replaced via fix25.js');
} else {
  console.log('Could not find start or end for fix25.js');
}
