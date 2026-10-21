import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Let's find the substring from `onClick={() => { playInteractiveSound('click'); setParentSubView('attendance'); }}`
// up to `</div>\n                                    )}` before `lg:col-span-8`
let startStr = "onClick={() => { playInteractiveSound('click'); setParentSubView('attendance'); }}";
let startIdx = content.indexOf(startStr);

if (startIdx !== -1) {
  let searchTarget = "                                    )}";
  let endIdx = content.indexOf(searchTarget, startIdx);
  if (endIdx !== -1) {
    let targetBlock = content.substring(startIdx, endIdx + searchTarget.length);
    console.log("Found target block length:", targetBlock.length);
    
    let replacement = `onClick={() => { playInteractiveSound('click'); setParentSubView('attendance'); }}
                                       className={\`px-4 py-2.5 text-xs font-black rounded-t-xl border-t border-x transition-all -mb-px shrink-0 \${
                                         parentSubView === 'attendance'
                                           ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-indigo-600 dark:text-indigo-400 border-b-white dark:border-b-stone-900 z-10'
                                           : 'bg-stone-50/60 dark:bg-stone-950/40 border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100/60 dark:hover:bg-stone-900/40'
                                       }\`}
                                     >
                                       📅 አቴንዳንስና ምግባር (Attendance)
                                     </button>`;
                                     
    // Actually let's locate the button start before startStr
    let btnStart = content.lastIndexOf('<button', startIdx);
    let fullBlockToReplace = content.substring(btnStart, endIdx + searchTarget.length);
    
    content = content.replace(fullBlockToReplace, `<button
                                       type="button"
                                       onClick={() => { playInteractiveSound('click'); setParentSubView('attendance'); }}
                                       className={\`px-4 py-2.5 text-xs font-black rounded-t-xl border-t border-x transition-all -mb-px shrink-0 \${
                                         parentSubView === 'attendance'
                                           ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-indigo-600 dark:text-indigo-400 border-b-white dark:border-b-stone-900 z-10'
                                           : 'bg-stone-50/60 dark:bg-stone-950/40 border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100/60 dark:hover:bg-stone-900/40'
                                       }\`}
                                     >
                                       📅 አቴንዳንስና ምግባር (Attendance)
                                     </button>`);
                                     
    fs.writeFileSync('src/App.tsx', content, 'utf8');
    console.log('Successfully replaced via fix26.js');
  } else {
    console.log('End index not found');
  }
} else {
  console.log('Start index not found');
}
