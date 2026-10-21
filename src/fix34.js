import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

let startMarker = '{/* ================= QUICK VIEW STATS MODAL ================= */}';
let endMarker = '{/* ================= MANUAL PDF DOWNLOAD MODAL ================= */}';

let startIdx = content.indexOf(startMarker);
let endIdx = content.indexOf(endMarker);

console.log('startIdx:', startIdx, 'endIdx:', endIdx);

if (startIdx !== -1 && endIdx !== -1) {
  let modalReplacement = `{/* ================= QUICK VIEW STATS MODAL ================= */}
      {quickViewCategory && (
        <div className="fixed inset-0 z-[130] overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={\`rounded-3xl w-full max-w-md shadow-2xl border p-6 space-y-4 transition-all duration-300 \${
            themeMode === 'dark' 
              ? 'bg-stone-900 border-stone-800 text-stone-100 shadow-stone-950/85' 
              : 'bg-white border-stone-200 text-stone-900 shadow-2xl shadow-stone-300/50'
          }\`}>
            <div className="flex items-center justify-between border-b pb-3 dark:border-stone-850">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <div className="text-left">
                  <h4 className="font-extrabold text-sm uppercase tracking-wide">
                    {quickViewCategory === 'students' && 'የተማሪዎች ስታቲስቲክስ (Students Stats)'}
                    {quickViewCategory === 'grades' && 'የውጤቶች ስታቲስቲክስ (Grades Stats)'}
                    {quickViewCategory === 'teachers' && 'የመምህራን ስታቲስቲክስ (Teachers Stats)'}
                    {quickViewCategory === 'average' && 'አጠቃላይ አማካይ (General Average)'}
                  </h4>
                  <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Quick Information Overview</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { playInteractiveSound('click'); setQuickViewCategory(null); }}
                className={\`w-6.5 h-6.5 rounded-full border flex items-center justify-center cursor-pointer transition-all \${
                  themeMode === 'dark' 
                    ? 'border-stone-800 hover:bg-stone-800 text-stone-400' 
                    : 'border-stone-150 hover:bg-stone-100 text-stone-500'
                }\`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs py-1">
              {quickViewCategory === 'students' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={\`p-3 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center\`}>
                      <span className="block text-[10px] uppercase font-bold text-stone-400">Grade 7</span>
                      <strong className="text-base font-black">{students.filter(s => s.grade === 'Grade 7' || s.grade.includes('7')).length}</strong>
                    </div>
                    <div className={\`p-3 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center\`}>
                      <span className="block text-[10px] uppercase font-bold text-stone-400">Grade 8</span>
                      <strong className="text-base font-black">{students.filter(s => s.grade === 'Grade 8' || s.grade.includes('8')).length}</strong>
                    </div>
                  </div>

                  <div className={\`p-3.5 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-850/50 border-slate-750' : 'bg-stone-50 border-stone-150'}\`}>
                    <h5 className="font-bold text-[11px] uppercase tracking-wider text-stone-400 mb-2">👫 ጾታ ምጣኔ (Gender Distribution)</h5>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span>ወንድ (Male)</span>
                          <span>{students.filter(s => s.gender === 'Male').length} ተማሪዎች</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: \`\${students.length ? (students.filter(s => s.gender === 'Male').length / students.length) * 100 : 0}%\` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span>ሴት (Female)</span>
                          <span>{students.filter(s => s.gender === 'Female').length} ተማሪዎች</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-pink-500" 
                            style={{ width: \`\${students.length ? (students.filter(s => s.gender === 'Female').length / students.length) * 100 : 0}%\` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider text-stone-400 block">🆕 የቅርብ ጊዜ ተማሪዎች (Recent Registrations)</span>
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                      {students.slice(-3).reverse().map(st => (
                        <div key={st.id} className={\`p-2 rounded-lg flex items-center justify-between text-[11px] border \${themeMode === 'dark' ? 'bg-slate-850 border-slate-750/50' : 'bg-white border-stone-100'}\`}>
                          <span className="font-semibold">{st.name}</span>
                          <span className="text-[10px] font-mono text-stone-400 bg-stone-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{st.grade}-{st.section}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {quickViewCategory === 'grades' && (
                <div className="space-y-3">
                  <div className={\`p-3.5 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-850/50 border-slate-750' : 'bg-stone-50 border-stone-150'}\`}>
                    <h5 className="font-bold text-[11px] uppercase tracking-wider text-stone-400 mb-2">📊 የውጤቶች ደረጃ ክፍፍል (Grade Performance Ranges)</h5>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold">
                        <span>A (&gt;= 90%):</span>
                        <span>{grades.filter(g => g.total >= 90).length}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 text-green-500 font-bold">
                        <span>B (75-89%):</span>
                        <span>{grades.filter(g => g.total >= 75 && g.total < 90).length}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 text-amber-500 font-bold">
                        <span>C (50-74%):</span>
                        <span>{grades.filter(g => g.total >= 50 && g.total < 75).length}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 text-rose-500 font-bold">
                        <span>F (&lt; 50%):</span>
                        <span>{grades.filter(g => g.total < 50).length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={\`p-3 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center\`}>
                      <span className="block text-[10px] uppercase font-bold text-stone-400">ያልጸደቁ (Pending)</span>
                      <strong className="text-base font-black text-amber-500">{grades.filter(g => !g.isApproved).length}</strong>
                    </div>
                    <div className={\`p-3 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center\`}>
                      <span className="block text-[10px] uppercase font-bold text-stone-400">የጸደቁ (Verified)</span>
                      <strong className="text-base font-black text-emerald-500">{grades.filter(g => g.isApproved).length}</strong>
                    </div>
                  </div>

                  <div className="text-[10px] text-stone-400 text-center leading-relaxed font-medium">
                    * የተማሪዎችን የሪፖርት ካርድ እና ውጤት ማስተዳደሪያውን ለመክፈት ከላይ ያለውን የውጤት ፖርታል (Grade Tracker) ይመልከቱ።
                  </div>
                </div>
              )}

              {quickViewCategory === 'teachers' && (
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

              {quickViewCategory === 'average' && (
                <div className="space-y-3">
                  <div className={\`p-3.5 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-850/50 border-slate-750' : 'bg-stone-50 border-stone-150'} text-center\`}>
                    <span className="block text-[10px] uppercase font-bold text-stone-400 mb-1">አጠቃላይ የማለፍ ምጣኔ (Passing Rate)</span>
                    <strong className="text-2xl font-black text-amber-500">
                      {grades.length ? Math.round((grades.filter(g => g.total >= 50).length / grades.length) * 100) : 0}%
                    </strong>
                    <span className="block text-[10px] text-stone-400 mt-1 font-medium">ከ 100% ውስጥ 50% እና ከዚያ በላይ ያመጡ ተማሪዎች</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={\`p-3 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center\`}>
                      <span className="block text-[10px] uppercase font-bold text-stone-400">ከፍተኛው ውጤት (Max Score)</span>
                      <strong className="text-base font-black text-emerald-500">
                        {grades.length ? Math.max(...grades.map(g => g.total)) : 0}%
                      </strong>
                    </div>
                    <div className={\`p-3 rounded-xl border \${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center\`}>
                      <span className="block text-[10px] uppercase font-bold text-stone-400">አጠቃላይ ተመዝጋቢ (Total Graded)</span>
                      <strong className="text-base font-black text-indigo-500">
                        {grades.length} ውጤቶች
                      </strong>
                    </div>
                  </div>

                  {(() => {
                    const subjMap = {};
                    grades.forEach(g => {
                      if (!subjMap[g.subject]) {
                        subjMap[g.subject] = { sum: 0, count: 0 };
                      }
                      subjMap[g.subject].sum += g.total;
                      subjMap[g.subject].count += 1;
                    });
                    let bestSubj = '';
                    let bestAvg = 0;
                    Object.entries(subjMap).forEach(([subj, data]) => {
                      const avg = data.sum / data.count;
                      if (avg > bestAvg) {
                        bestAvg = avg;
                        bestSubj = subj;
                      }
                    });

                    if (bestSubj) {
                      return (
                        <div className={\`p-3 rounded-xl border flex items-center justify-between \${themeMode === 'dark' ? 'bg-slate-850/50 border-slate-750' : 'bg-stone-50 border-stone-150'}\`}>
                          <div className="text-left">
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">ከፍተኛ ውጤት የተመዘገበበት ትምህርት</span>
                            <strong className="text-[11.5px] font-black">{bestSubj}</strong>
                          </div>
                          <strong className="text-base font-black text-emerald-500">{Math.round(bestAvg)}%</strong>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-850">
              <button
                type="button"
                onClick={() => { playInteractiveSound('click'); setQuickViewCategory(null); }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
              >
                እሺ ተረዳሁ (Close View)
              </button>
            </div>
          </div>
        </div>
      )}

      `;

  let blockToReplace = content.substring(startIdx, endIdx);
  content = content.replace(blockToReplace, modalReplacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Successfully replaced quick view modal block via fix34.js');
} else {
  console.log('Markers not found for fix34.js');
}
