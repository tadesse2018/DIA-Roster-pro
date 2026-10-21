import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix themeMode toggle (lines 3481-3489)
let t1Old = `{themeMode === 'dark' ? (
                              <span className="text-[11px]">☀️</span>
                <span>{tx('ብርሃን ሁነታ (Light Mode)')}</span>
                          ) : (`;

let t1New = `{themeMode === 'dark' ? (
              <>
                <span className="text-[11px]">☀️</span>
                <span>{tx('ብርሃን ሁነታ (Light Mode)')}</span>
              </>
                          ) : (`;

if (content.includes(t1Old)) {
  content = content.replace(t1Old, t1New);
  console.log('Fixed themeMode toggle');
} else {
  console.log('themeMode toggle target not found exactly');
}

// 2. Fix attendance IIFE return and button (lines 6046 to 6146)
// Let's restore the IIFE return with a fragment wrapping both the card and the button
let attTarget = `                                         return (
                                           <div className="space-y-4">
                                           <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-4 md:col-span-2 shadow-xs">`;

// Let's search for the broken block between return and })()
let brokenStart = `                                         return (`;
let brokenEnd = `                                     </div>`;

// Let's use a cleaner approach: replace from `return (` inside the daily attendance IIFE to `})()` with clean fragment code.
// Let's find the exact block for daily attendance IIFE return:
let attendanceIIFEStart = `                                         return (
                                           <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-4 md:col-span-2 shadow-xs">`;

if (content.includes(attendanceIIFEStart)) {
  // We want to wrap the card and the print button in a fragment inside return ( <> ... </> )
  let oldBlockStart = attendanceIIFEStart;
  // Let's find where this IIFE ends around line 6145
  // Let's check if we can replace the whole attendance IIFE return section cleanly.
}

// 3. Fix quickView modal body by wrapping its contents in <> ... </>
let qvTarget = `            <div className="space-y-3.5 text-xs py-1">
              {quickViewCategory === 'students' && (`;

let qvReplacement = `            <div className="space-y-3.5 text-xs py-1">
              <>
                {quickViewCategory === 'students' && (`;

if (content.includes(qvTarget)) {
  content = content.replace(qvTarget, qvReplacement);
  // Find where quickViewCategory conditionals end (before closing div of modal body)
  // Right before {/ * = = = = MANUAL PDF DOWNLOAD MODAL = = = = /} or before the modal closing div
  let qvEndTarget = `              {quickViewCategory === 'teachers' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={\`p-3 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center\`}>
                      <span className="block text-[10px] uppercase font-bold text-stone-400">የክፍል ኃላፊዎች (Homeroom)</span>
                      <strong className="text-base font-black">{teachers.filter(t => t.isHomeroomTeacher).length}</strong>
                    </div>
                    <div className={\`p-3 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center\`}>
                      <span className="block text-[10px] uppercase font-bold text-stone-400">ሌሎች መምህራን (Regular)</span>
                      <strong className="text-base font-black">{teachers.filter(t => !t.isHomeroomTeacher).length}</strong>
                    </div>
                  </div>

                  <div className={\`p-3.5 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-850/50 border-slate-750' : 'bg-stone-50 border-stone-150'}\`}>
                    <h5 className="font-bold text-[11px] uppercase tracking-wider text-stone-400 mb-2">📚 መምህራን የሚያስተምሯቸው ክፍሎች (Assigned Grades)</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(teachers.map(t => t.assignedClass))).map(cl => (
                        <span key={cl} className="px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold rounded-lg text-[10px] tracking-wide uppercase border border-purple-500/20">
                          {cl}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider text-stone-400 block">🎓 የትምህርት ደረጃ ክፍፍል (Education Levels)</span>
                    <div className="space-y-1 text-[11px]">
                      {['Degree', 'Diploma', 'Masters'].map(lvl => {
                        const count = teachers.filter(t => t.educationLevel?.toLowerCase().includes(lvl.toLowerCase())).length;
                        return (
                          <div key={lvl} className="flex justify-between font-semibold border-b border-stone-100 dark:border-stone-850/50 pb-1">
                            <span>{lvl}:</span>
                            <span className="font-bold">{count} መምህራን</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>`;

  let qvEndReplacement = `              {quickViewCategory === 'teachers' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={\`p-3 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center\`}>
                      <span className="block text-[10px] uppercase font-bold text-stone-400">የክፍል ኃላፊዎች (Homeroom)</span>
                      <strong className="text-base font-black">{teachers.filter(t => t.isHomeroomTeacher).length}</strong>
                    </div>
                    <div className={\`p-3 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center\`}>
                      <span className="block text-[10px] uppercase font-bold text-stone-400">ሌሎች መምህራን (Regular)</span>
                      <strong className="text-base font-black">{teachers.filter(t => !t.isHomeroomTeacher).length}</strong>
                    </div>
                  </div>

                  <div className={\`p-3.5 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-850/50 border-slate-750' : 'bg-stone-50 border-stone-150'}\`}>
                    <h5 className="font-bold text-[11px] uppercase tracking-wider text-stone-400 mb-2">📚 መምህራን የሚያስተምሯቸው ክፍሎች (Assigned Grades)</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(teachers.map(t => t.assignedClass))).map(cl => (
                        <span key={cl} className="px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold rounded-lg text-[10px] tracking-wide uppercase border border-purple-500/20">
                          {cl}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider text-stone-400 block">🎓 የትምህርት ደረጃ ክፍፍል (Education Levels)</span>
                    <div className="space-y-1 text-[11px]">
                      {['Degree', 'Diploma', 'Masters'].map(lvl => {
                        const count = teachers.filter(t => t.educationLevel?.toLowerCase().includes(lvl.toLowerCase())).length;
                        return (
                          <div key={lvl} className="flex justify-between font-semibold border-b border-stone-100 dark:border-stone-850/50 pb-1">
                            <span>{lvl}:</span>
                            <span className="font-bold">{count} መምህራን</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              </>
            </div>`;

  if (content.includes(qvEndTarget)) {
    content = content.replace(qvEndTarget, qvEndReplacement);
    console.log('Wrapped quickView category blocks in fragment');
  }
}

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Done fix14.js');
