import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

let startMarker = '{/* Parent tab switchers (ውጤት, ማስታወቂያ, አቴንዳንስ) */}';
let endMarker = '<div className="lg:col-span-8 bg-white border border-stone-200 p-6 rounded-2xl shadow-xs space-y-6">';

let startIdx = content.indexOf(startMarker);
let endIdx = content.indexOf(endMarker);

console.log('startIdx:', startIdx, 'endIdx:', endIdx);

if (startIdx !== -1 && endIdx !== -1) {
  let cleanLeftColumn = `{/* Parent tab switchers (ውጤት, ማስታወቂያ, አቴንዳንስ) */}
                                   <div className="flex flex-col border border-stone-200 rounded-2xl p-4 bg-white shadow-xs gap-2">
                                     <button
                                       type="button"
                                       onClick={() => { playInteractiveSound('click'); setParentSubView('grades'); }}
                                       className={\`px-4 py-3 text-xs font-black rounded-xl text-left transition-all flex items-center gap-2 \${
                                         parentSubView === 'grades'
                                           ? 'bg-indigo-600 text-white shadow-sm'
                                           : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                                       }\`}
                                     >
                                       <span>📚</span> የልጅዎ ውጤት (Grades & Report Card)
                                     </button>
                                     <button
                                       type="button"
                                       onClick={() => { playInteractiveSound('click'); setParentSubView('notices'); }}
                                       className={\`px-4 py-3 text-xs font-black rounded-xl text-left transition-all flex items-center gap-2 \${
                                         parentSubView === 'notices'
                                           ? 'bg-indigo-600 text-white shadow-sm'
                                           : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                                       }\`}
                                     >
                                       <span>📢</span> የትምህርት ቤት ማስታወቂያዎች (Notices)
                                     </button>
                                     <button
                                       type="button"
                                       onClick={() => { playInteractiveSound('click'); setParentSubView('attendance'); }}
                                       className={\`px-4 py-3 text-xs font-black rounded-xl text-left transition-all flex items-center gap-2 \${
                                         parentSubView === 'attendance'
                                           ? 'bg-indigo-600 text-white shadow-sm'
                                           : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                                       }\`}
                                     >
                                       <span>📅</span> አቴንዳንስና ምግባር (Attendance)
                                     </button>
                                   </div>

                                   <button
                                     onClick={() => {
                                       playInteractiveSound('click');
                                       setSelectedQRStudent(foundStudent);
                                     }}
                                     className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                                     title="QR ካርድ አትም"
                                   >
                                     <Printer className="w-3.5 h-3.5" />
                                     አትም (Print ID Card)
                                   </button>
                                   </div>

                                   `;

  let blockToReplace = content.substring(startIdx, endIdx);
  content = content.replace(blockToReplace, cleanLeftColumn);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Successfully cleaned left column via fix31.js');
} else {
  console.log('Markers not found for fix31.js');
}
