const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldUI = `                  {/* Dynamic Subjects Manager */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1">📚 የትምህርት አይነቶች ዝርዝር (SaaS Dynamic Curriculum):</label>
                      <p className="text-slate-400 text-[11px]">
                        ተማሪዎች የሚማሩትንና ውጤት የሚመዘገብባቸውን የትምህርት አይነቶች እዚህ ያስተዳድሩ። (Subjects can be added or removed below)
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-xl">
                      {wlSubjects.map((sub, index) => (
                        <div 
                          key={index} 
                          className="bg-slate-100 hover:bg-rose-50 text-slate-800 hover:text-rose-900 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2 transition-all group"
                        >
                          <span>📚 {sub}</span>
                          <button
                            type="button"
                            onClick={() => {
                              playInteractiveSound('wrong');
                              setWlSubjects(prev => prev.filter(s => s !== sub));
                            }}
                            className="text-slate-400 hover:text-rose-600 focus:outline-none transition-all"
                            title="Remove Subject"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {wlSubjects.length === 0 && (
                        <span className="text-xs text-slate-400 italic p-2">ምንም ትምህርት አይነት አልተጨመረም! (No subjects defined yet)</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={wlNewSubject}
                        onChange={(e) => setWlNewSubject(e.target.value)}
                        placeholder="አዲስ የትምህርት አይነት (e.g. History, Geography, ICT)"
                        className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 outline-none bg-white font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = wlNewSubject.trim();
                          if (val) {
                            const isDup = wlSubjects.some(sub => sub.toLowerCase().trim() === val.toLowerCase());
                            if (isDup) {
                              playInteractiveSound('wrong');
                              alert(\`⚠️ የትምህርት አይነት "\${val}" ቀደም ሲል ተመዝግቧል! (Subject "\${val}" is already registered!)\`);
                            } else {
                              playInteractiveSound('success');
                              setWlSubjects(prev => [...prev, val]);
                              setWlNewSubject('');
                            }
                          } else {
                            playInteractiveSound('wrong');
                          }
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
                      >
                        ➕ ጨምር (Add)
                      </button>
                    </div>
                  </div>`;

const newUI = `                  {/* Dynamic Subjects Manager by Grade */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1">📚 የትምህርት አይነቶች በየክፍሉ (Subjects by Grade):</label>
                      <p className="text-slate-400 text-[11px]">
                        ተማሪዎች የሚማሩትን የትምህርት አይነቶች በክፍል ደረጃ መድበው ያስተዳድሩ።
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-600">ክፍል ይምረጡ (Select Grade):</span>
                      <select 
                        value={wlSelectedGradeForSubjects}
                        onChange={(e) => setWlSelectedGradeForSubjects(e.target.value)}
                        className="p-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                      >
                        {(wlSchoolLevel === 'secondary' ? ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8']).map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-200 px-2 py-1 rounded-full">
                        {((wlSubjectsByGrade && wlSubjectsByGrade[wlSelectedGradeForSubjects]) || wlSubjects).length} ኮርሶች
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-xl">
                      {((wlSubjectsByGrade && wlSubjectsByGrade[wlSelectedGradeForSubjects]) || wlSubjects).map((sub, index) => (
                        <div 
                          key={index} 
                          className="bg-slate-100 hover:bg-rose-50 text-slate-800 hover:text-rose-900 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2 transition-all group"
                        >
                          <span>📚 {sub}</span>
                          <button
                            type="button"
                            onClick={() => {
                              playInteractiveSound('wrong');
                              const currentGradeSubjects = (wlSubjectsByGrade && wlSubjectsByGrade[wlSelectedGradeForSubjects]) || wlSubjects;
                              setWlSubjectsByGrade(prev => ({
                                ...prev,
                                [wlSelectedGradeForSubjects]: currentGradeSubjects.filter(s => s !== sub)
                              }));
                            }}
                            className="text-slate-400 hover:text-rose-600 focus:outline-none transition-all"
                            title="Remove Subject"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {((wlSubjectsByGrade && wlSubjectsByGrade[wlSelectedGradeForSubjects]) || wlSubjects).length === 0 && (
                        <span className="text-xs text-slate-400 italic p-2">ምንም ትምህርት አይነት አልተጨመረም! (No subjects defined yet)</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={wlNewSubject}
                        onChange={(e) => setWlNewSubject(e.target.value)}
                        placeholder={\`አዲስ የትምህርት አይነት ለ \${wlSelectedGradeForSubjects}\`}
                        className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 outline-none bg-white font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = wlNewSubject.trim();
                          if (val) {
                            const currentGradeSubjects = (wlSubjectsByGrade && wlSubjectsByGrade[wlSelectedGradeForSubjects]) || wlSubjects;
                            const isDup = currentGradeSubjects.some(sub => sub.toLowerCase().trim() === val.toLowerCase());
                            if (isDup) {
                              playInteractiveSound('wrong');
                              alert(\`⚠️ የትምህርት አይነት "\${val}" ቀደም ሲል በ \${wlSelectedGradeForSubjects} ተመዝግቧል!\`);
                            } else {
                              playInteractiveSound('success');
                              setWlSubjectsByGrade(prev => ({
                                ...prev,
                                [wlSelectedGradeForSubjects]: [...currentGradeSubjects, val]
                              }));
                              setWlNewSubject('');
                            }
                          } else {
                            playInteractiveSound('wrong');
                          }
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
                      >
                        ➕ ጨምር (Add)
                      </button>
                    </div>
                    
                    <button
                        type="button"
                        onClick={() => {
                           if(window.confirm('ይህን የትምህርት ዝርዝር ወደ ሁሉም ክፍሎች መገልበጥ ይፈልጋሉ? (Copy to all grades?)')) {
                               const currentGradeSubjects = (wlSubjectsByGrade && wlSubjectsByGrade[wlSelectedGradeForSubjects]) || wlSubjects;
                               const grades = wlSchoolLevel === 'secondary' ? ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
                               const newObj = { ...wlSubjectsByGrade };
                               grades.forEach(g => newObj[g] = [...currentGradeSubjects]);
                               setWlSubjectsByGrade(newObj);
                               playInteractiveSound('success');
                           }
                        }}
                        className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold underline"
                    >
                        🔄 ይህንን ዝርዝር ለሁሉም ክፍሎች ገልብጥ (Copy to all grades)
                    </button>
                  </div>`;

if (code.includes('📚 የትምህርት አይነቶች ዝርዝር (SaaS Dynamic Curriculum):')) {
    code = code.replace(oldUI, newUI);
    fs.writeFileSync('src/App.tsx', code, 'utf8');
    console.log("Successfully replaced subjects UI");
} else {
    console.log("Could not find the old subjects UI");
}
