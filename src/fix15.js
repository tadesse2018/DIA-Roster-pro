import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

let target = `                                         return (
                                           <div className="space-y-4">
                                           <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-4 md:col-span-2 shadow-xs">`;

// Let's find the entire block from `return (` right before the attendance history table to the end of the button around line 6140
// Let's locate the IIFE call around `daily attendance history log`
let startMarker = `                                         return (
                                           <div className="space-y-4">
                                           <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-4 md:col-span-2 shadow-xs">`;

// Let's read lines and locate the exact indices for this block
let lines = content.split('\n');
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('🗓️ ዝርዝር የእለታዊ አቴንዳንስ መዝገብ')) {
    // go back a few lines to find `return (`
    for (let j = i - 5; j >= 0; j--) {
      if (lines[j].includes('return (')) {
        startIndex = j;
        break;
      }
    }
    break;
  }
}

if (startIndex !== -1) {
  // Find where `})()` occurs after startIndex
  for (let i = startIndex; i < lines.length; i++) {
    if (lines[i].includes('})()') && i > startIndex + 20) {
      // Look a bit further down for the stray div
      endIndex = i + 1; // include line with `})()` and possibly the stray `<div className="space-y-4">`
      if (i + 5 < lines.length && lines[i+1].includes('<div className="space-y-4">')) {
        // find closing div of it
        for (let k = i + 1; k < i + 15; k++) {
          if (lines[k].includes('</div>')) {
            endIndex = k;
            break;
          }
        }
      }
      break;
    }
  }
}

console.log('startIndex:', startIndex, 'endIndex:', endIndex);

if (startIndex !== -1 && endIndex !== -1) {
  let replacementBlock = [
    '                                         return (',
    '                                           <>',
    '                                             <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-4 md:col-span-2 shadow-xs">',
    '                                               <div className="flex flex-col sm:flex-row sm:items-center border-b border-stone-100 dark:border-stone-800 pb-3 justify-between gap-2">',
    '                                                 <div className="flex items-center gap-2">',
    '                                                   <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />',
    '                                                   <h4 className="text-sm uppercase text-stone-700 dark:text-stone-300 font-black tracking-wider">',
    '                                                     🗓️ ዝርዝር የእለታዊ አቴንዳንስ መዝገብ (Daily Attendance History Log)',
    '                                                   </h4>',
    '                                                 </div>',
    '                                                <div className="flex items-center gap-2 self-end sm:self-auto">',
    '                                                  {history.length > 0 && (',
    '                                                    <button',
    '                                                      onClick={() => handleExportAttendancePDF(foundStudent, history)}',
    '                                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"',
    '                                                    >',
    '                                                      <Printer className="w-3.5 h-3.5" /> ፒዲኤፍ አውርድ (Export PDF)',
    '                                                    </button>',
    '                                                  )}',
    '                                                  <span className="text-[10px] bg-stone-100 dark:bg-stone-950/60 border border-stone-200/50 dark:border-stone-800 px-2.5 py-1.5 rounded-md font-mono text-stone-500 font-bold">',
    '                                                    ብዛት፡ {history.length} ቀናት',
    '                                                  }',
    '                                                </div>',
    '                                              </div>',
    '',
    '                                             {history.length > 0 ? (',
    '                                               <div className="overflow-x-auto rounded-xl border border-stone-150 dark:border-stone-800 shadow-3xs bg-white dark:bg-stone-900">',
    '                                                 <table className="w-full text-xs text-left border-collapse min-w-[500px]">',
    '                                                   <thead>',
    '                                                     <tr className="bg-stone-50 dark:bg-stone-950/60 text-stone-500 dark:text-stone-400 uppercase font-black text-[10px] tracking-wider border-b border-stone-200 dark:border-stone-800">',
    '                                                       <th className="p-3">📅 ቀን በአውሮፓውያን (Gregorian Date)</th>',
    '                                                       <th className="p-3">🇪🇹 ቀን በኢትዮጵያ (Ethiopian Date)</th>',
    '                                                       <th className="p-3 text-center">ሁኔታ (Status)</th>',
    '                                                       <th className="p-3 text-center">ምልክት (Symbol)</th>',
    '                                                     </tr>',
    '                                                   </thead>',
    '                                                   <tbody className="divide-y divide-stone-100 dark:divide-stone-800">',
    '                                                     {history.map((h, i) => {',
    '                                                       const dateObj = new Date(h.date + \'T12:00:00\');',
    '                                                       const dual = getFormattedDualCalendarDate(dateObj);',
    '                                                       return (',
    '                                                         <tr key={i} className="hover:bg-stone-50/50 dark:hover:bg-stone-950/30 transition-colors">',
    '                                                           <td className="p-3 font-semibold text-stone-700 dark:text-stone-300 font-mono">',
    '                                                             {dual.gc}',
    '                                                           </td>',
    '                                                           <td className="p-3 font-extrabold text-stone-900 dark:text-stone-100">',
    '                                                             {dual.ec}',
    '                                                           </td>',
    '                                                           <td className="p-3 text-center">',
    '                                                             <span className={\`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase \${',
    '                                                               h.status === \'present\' ? \'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60\' :',
    '                                                               h.status === \'absent\' ? \'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 border border-rose-100 dark:border-rose-800/60 font-bold animate-pulse\' :',
    '                                                               \'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border border-amber-100 dark:border-amber-800/60\'',
    '                                                             }\`}>',
    '                                                               {h.status === \'present\' ? \'✓ የመጣ (Present)\' :',
    '                                                                h.status === \'absent\' ? \'✗ የቀረ (Absent)\' :',
    '                                                                \'✏ ፈቃድ (Excused)\'}',
    '                                                             </span>',
    '                                                           </td>',
    '                                                           <td className="p-3 text-center">',
    '                                                             <span className={\`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm mx-auto shadow-3xs \${',
    '                                                               h.status === \'present\' ? \'bg-emerald-500 text-white\' :',
    '                                                               h.status === \'absent\' ? \'bg-rose-500 text-white\' :',
    '                                                               \'bg-amber-500 text-white\'',
    '                                                             }\`}>',
    '                                                               {h.status === \'present\' ? \'✔\' :',
    '                                                                h.status === \'absent\' ? \'✘\' :',
    '                                                                \'📝\'}',
    '                                                             </span>',
    '                                                           </td>',
    '                                                         </tr>',
    '                                                       );',
    '                                                     })}',
    '                                                   </tbody>',
    '                                                 </table>',
    '                                               </div>',
    '                                             ) : (',
    '                                               <div className="text-center py-10 bg-stone-50 dark:bg-stone-950/10 border border-stone-150 dark:border-stone-850 rounded-xl">',
    '                                                 <CalendarDays className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />',
    '                                                 <p className="text-stone-500 dark:text-stone-400 text-xs font-semibold mt-2">',
    '                                                   እስካሁን ምንም የእለታዊ አቴንዳንስ መረጃ አልተመዘገበም (No daily attendance entries yet)',
    '                                                  </p>',
    '                                                </div>',
    '                                             )}',
    '                                            </div>',
    '                                            <button',
    '                                              onClick={() => {',
    '                                                playInteractiveSound(\'click\');',
    '                                                setSelectedQRStudent(foundStudent);',
    '                                              }}',
    '                                              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"',
    '                                              title="QR ካርድ አትም"',
    '                                            >',
    '                                              <Printer className="w-3.5 h-3.5" />',
    '                                              አትም (Print ID Card)',
    '                                            </button>',
    '                                           </>,',
    '                                       );',
    '                                        })()'
  ];

  lines.splice(startIndex, endIndex - startIndex + 1, ...replacementBlock);
  fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
  console.log('Successfully replaced attendance block via fix15.js');
} else {
  console.log('Could not find startIndex or endIndex');
}
