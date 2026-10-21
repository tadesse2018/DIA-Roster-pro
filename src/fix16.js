import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix line 6069
let target6069 = `                                                 ኅዛት፡ {history.length} ቀናት
                                                   }
                                                 </div>`;

// Or search for `ብዛት፡ {history.length} ቀናት`
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('ብዛት፡ {history.length} ቀናት')) {
    if (lines[i+1] && lines[i+1].includes('}')) {
      lines[i+1] = '                                                   </span>';
      console.log('Fixed attendance count span at line', i+1);
    }
  }
}

content = lines.join('\n');

// 2. Fix quickView fragment closing
// We want `</>` right after `</div>` of `average` block (line 10492) and before `            <div className="pt-2 border-t ...">`
let qvSplitTarget = `                   })()}
                 </div>


            <div className="pt-2 border-t border-stone-100 dark:border-stone-850">`;

let qvSplitReplacement = `                   })()}
                 </div>
              )}
              </>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-850">`;

if (content.includes(qvSplitTarget)) {
  content = content.replace(qvSplitTarget, qvSplitReplacement);
  console.log('Fixed quickView fragment closing');
} else {
  console.log('qvSplitTarget not found exactly');
}

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Done fix16.js');
