import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("setParentSubView('attendance')") && lines[i+1] && lines[i+1].includes("parentSubView === 'attendance' &&")) {
    startIdx = i;
    break;
  }
}

if (startIdx !== -1) {
  // Find where this misplaced block ends (around line 5941)
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].trim() === '</div>' && lines[i+1] && lines[i+1].includes('lg:col-span-8')) {
      endIdx = i;
      break;
    }
  }
}

console.log('startIdx:', startIdx, 'endIdx:', endIdx);

if (startIdx !== -1 && endIdx !== -1) {
  let correctButton = [
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

  lines.splice(startIdx, endIdx - startIdx + 1, ...correctButton);
  fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
  console.log('Cleaned up misplaced attendance block via fix24.js');
} else {
  console.log('Could not find startIdx or endIdx for fix24.js');
}
