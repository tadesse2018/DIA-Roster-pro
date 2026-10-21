import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

const replacementLines = [
  '                                             </p>',
  '                                           </div>',
  '                                         </div>',
  '                                       </div>',
  '',
  '                                       {/* Daily Attendance History list */}',
  '                                       {(() => {',
  '                                         const history = (() => {',
  '                                           if (!foundStudent) return [];',
  '                                           try {',
  '                                             const saved = JSON.parse(localStorage.getItem(\'dailyAttendance\') || \'{}\');',
  '                                             const list: { date: string; status: \'present\' | \'absent\' | \'excused\' }[] = [];',
  '                                             Object.keys(saved).forEach((dateStr) => {',
  '                                               const dayRecord = saved[dateStr];',
  '                                               if (dayRecord && dayRecord[foundStudent.id]) {',
  '                                                 list.push({',
  '                                                   date: dateStr,',
  '                                                   status: dayRecord[foundStudent.id],',
  '                                                 });',
  '                                               }',
  '                                             });',
  '                                             return list.sort((a, b) => b.date.localeCompare(a.date));',
  '                                           } catch (e) {',
  '                                             return [];',
  '                                           }',
  '                                         })();',
  '',
  '                                         return (',
  '                                           <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-4 md:col-span-2 shadow-xs">',
  '                                             <div className="flex flex-col sm:flex-row sm:items-center border-b border-stone-100 dark:border-stone-800 pb-3 justify-between gap-2">',
  '                                               <div className="flex items-center gap-2">',
  '                                                 <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />',
  '                                                 <h4 className="text-sm uppercase text-stone-700 dark:text-stone-300 font-black tracking-wider">',
  '                                                   🗓️ ዝርዝር የእለታዊ አቴንዳንስ መዝገብ (Daily Attendance History Log)',
  '                                                 </h4>',
  '                                               </div>'
];

lines.splice(6018, 6029 - 6018 + 1, ...replacementLines);

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Successfully fixed attendance block corruption!');
