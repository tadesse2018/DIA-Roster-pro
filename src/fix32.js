import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Let's find the exact start marker for parent search results canvas
let startMarker = '{/* Parent search results canvas */}';
let startIdx = content.indexOf(startMarker);

// Let's find the end marker: `{/\* TAB 1.5: THE SAAS WHITE-LABEL SETUP CONFIGURATOR \*/}`
let endMarker = '{/* TAB 1.5: THE SAAS WHITE-LABEL SETUP CONFIGURATOR */}';
let endIdx = content.indexOf(endMarker);

console.log('startIdx:', startIdx, 'endIdx:', endIdx);

if (startIdx !== -1 && endIdx !== -1) {
  let replacement = `{/* Parent search results canvas */}
                      <div className="lg:col-span-8 bg-white border border-stone-200 p-6 rounded-2xl shadow-xs min-h-[300px]">
                        <AnimatePresence mode="wait">
                          {parentSearched ? (
                            <motion.div
                              key={searchId}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-6"
                            >
                              {foundStudent ? (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
                                  <div className="lg:col-span-4 space-y-6">
                                    {/* Student profile and metadata info bar */}
                                    <div className="p-5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                      <div>
                                        <span className="text-indigo-800 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider bg-indigo-100/60 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md">📄 የተማሪው ማህደር (Student Profile)</span>
                                        <h4 className="text-xl font-extrabold text-stone-900 dark:text-stone-50 mt-2 flex items-center gap-2">
                                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                          {foundStudent.name}
                                        </h4>
                                        <p className="text-stone-500 dark:text-stone-400 text-xs font-semibold mt-1">
                                          ጾታ፡ <span className="text-stone-800 dark:text-stone-200 font-bold">{foundStudent.gender === 'Male' ? 'ወንድ' : 'ሴት'}</span> • ክፍል፡ <span className="text-stone-800 dark:text-stone-200 font-bold">{foundStudent.grade} - {foundStudent.section}</span>
                                        </p>
                                      </div>
                                      <div className="sm:text-right bg-stone-50/60 dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs self-stretch sm:self-auto flex sm:flex-col justify-between items-center sm:items-end">
                                        <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase block">ልዩ መታወቂያ (ID)</span>
                                        <span className="font-mono font-black text-indigo-700 dark:text-indigo-400 text-lg tracking-wider">{foundStudent.id}</span>
                                      </div>
                                    </div>

                                    {/* Parent tab switchers (ውጤት, ማስታወቂያ, አቴንዳንስ) */}
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

                                  <div className="lg:col-span-8 bg-white border border-stone-200 p-6 rounded-2xl shadow-xs space-y-6">
                                    {parentSubView === 'grades' && (
                                      <div className="space-y-6">
                                        <div className="flex justify-between items-center flex-wrap gap-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
                                          <div>
                                            <h4 className="font-bold text-stone-800 text-sm">የተማሪው የውጤት ሪፖርት (Student Report Card Sheet)</h4>
                                            <p className="text-[11px] text-stone-400">Authenticated and verified by Principal</p>
                                          </div>
                                          <button
                                            onClick={() => { playInteractiveSound('success'); setShowPrintModal(true); }}
                                            className="px-4 py-2 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100/50 text-indigo-800 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 shadow-3xs cursor-pointer"
                                          >
                                            <Printer className="w-3.5 h-3.5" /> ማተሚያ ፎርማት (Print Report Card)
                                          </button>
                                        </div>

                                        <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
                                          <table className="w-full text-left border-collapse">
                                            <thead>
                                              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 text-xs font-black">
                                                <th className="p-3 text-left">ትምህርት (Subject)</th>
                                                <th className="p-3 text-center">ጥያቄ</th>
                                                <th className="p-3 text-center">ክፍል ስራ</th>
                                                <th className="p-3 text-center">የቤት ስራ</th>
                                                <th className="p-3 text-center">ግማሽ ፈተና ({wlMidMax}%)</th>
                                                <th className="p-3 text-center">ማጠቃለያ ፈተና ({wlFinalMax}%)</th>
                                                <th className="p-3 text-center">ጠቅላላ (Total)</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100 text-xs">
                                              {foundGrades.length > 0 ? (
                                                foundGrades.map((g) => {
                                                  const finalScore = g.quiz + g.cw + g.hw + g.mid + g.final;
                                                  return (
                                                    <tr key={g.id} className="hover:bg-stone-50/50 border-b border-stone-150 text-stone-800">
                                                      <td className="p-3 font-bold text-stone-900">{g.subject}</td>
                                                      <td className="p-3 text-center">{g.quiz}</td>
                                                      <td className="p-3 text-center">{g.cw}</td>
                                                      <td className="p-3 text-center">{g.hw}</td>
                                                      <td className="p-3 text-center">{g.mid}</td>
                                                      <td className="p-3 text-center">{g.final}</td>
                                                      <td className="p-3 text-center">
                                                        <span className={\`px-2 py-0.5 rounded-md font-bold \${
                                                          finalScore >= 85 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                                                          finalScore >= 60 ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                                                          'bg-rose-50 text-rose-800 border border-rose-100'
                                                        }\`}>
                                                          {finalScore}%
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  );
                                                })
                                              ) : (
                                                <tr>
                                                  <td colSpan={7} className="p-8 text-center text-stone-400 italic font-semibold">
                                                    እስካሁን ምንም የውጤት መረጃ አልተመዘገበም (No grades entered yet)
                                                  </td>
                                                </tr>
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}

                                    {parentSubView === 'notices' && (
                                      <div className="space-y-4">
                                        <h4 className="font-extrabold text-stone-800 text-sm">የትምህርት ቤት የቅርብ ጊዜ ማስታወቂያዎች (School Announcements)</h4>
                                        <div className="space-y-3">
                                          {announcements.map((ann) => (
                                            <div key={ann.id} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5">
                                              <div className="flex justify-between items-start gap-2 flex-wrap">
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md">
                                                  📣 {ann.category}
                                                </span>
                                                <span className="text-[10px] text-stone-400 font-mono font-bold">
                                                  {ann.date}
                                                </span>
                                              </div>
                                              <h5 className="font-bold text-stone-900 text-sm">{ann.title}</h5>
                                              <p className="text-stone-600 text-xs leading-relaxed">{ann.content}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {parentSubView === 'attendance' && (
                                      <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="bg-amber-500 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
                                            <div className="space-y-1">
                                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100 block">የመቅረት ሁኔታ (Attendance)</span>
                                              <p className="text-2xl font-black">{studentExtraInfo[foundStudent?.id || '']?.absent ?? 0} ቀናት ቀርተዋል</p>
                                              <span className="text-[10px] bg-amber-600 px-2 py-0.5 rounded-full font-bold inline-block">
                                                {(studentExtraInfo[foundStudent?.id || '']?.absent ?? 0) === 0 ? '💯 ሙሉ መገኘት (Perfect)' : 'ቀሪ ቀናት ተመዝግቧል'}
                                              </span>
                                            </div>
                                            <CalendarDays className="w-12 h-12 text-amber-200/40 shrink-0" />
                                          </div>

                                          <div className="bg-indigo-600 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
                                            <div className="space-y-1">
                                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-100 block">የምግባር ደረጃ (Conduct Grade)</span>
                                              <p className="text-2xl font-black">ውጤት: {studentExtraInfo[foundStudent?.id || '']?.conduct ?? 'A'}</p>
                                              <span className="text-[10px] bg-indigo-700 px-2 py-0.5 rounded-full font-bold inline-block">
                                                በክፍል አላፊው የተሰጠ ምዘና (Homeroom Teacher Assessment)
                                              </span>
                                            </div>
                                            <Award className="w-12 h-12 text-indigo-200/40 shrink-0" />
                                          </div>
                                        </div>

                                        <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-4 shadow-xs">
                                          <h4 className="font-extrabold text-stone-800 text-sm">🗓️ ዝርዝር የእለታዊ አቴንዳንስ መዝገብ (Daily Attendance History Log)</h4>
                                          {(() => {
                                            if (!foundStudent) return null;
                                            const historyList = [];
                                            try {
                                              const saved = JSON.parse(localStorage.getItem('dailyAttendance') || '{}');
                                              Object.keys(saved).forEach((dateStr) => {
                                                const dayRecord = saved[dateStr];
                                                if (dayRecord && dayRecord[foundStudent.id]) {
                                                  historyList.push({ date: dateStr, status: dayRecord[foundStudent.id] });
                                                }
                                              });
                                            } catch (e) {}
                                            historyList.sort((a, b) => b.date.localeCompare(a.date));
                                            return historyList.length > 0 ? (
                                              <div className="space-y-2">
                                                {historyList.map((h, idx) => (
                                                  <div key={idx} className="flex justify-between items-center p-3 border border-stone-100 rounded-xl bg-stone-50/50">
                                                    <span className="font-mono text-stone-700 font-bold">{h.date}</span>
                                                    <span className={\`px-2 py-0.5 rounded-md text-[10px] font-bold \${
                                                      h.status === 'present' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                                                      h.status === 'absent' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                                                      'bg-amber-50 text-amber-800 border border-amber-100'
                                                    }\`}>
                                                      {h.status === 'present' ? '✓ መጥቷል (Present)' : h.status === 'absent' ? '✗ የቀረ (Absent)' : '🕒 ፍቃድ (Excused)'}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-xs text-stone-400 italic">እስካሁን የተመዘገበ የእለት አቴንዳንስ መዝገብ የለም። (No daily attendance records found.)</p>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center p-8 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2">
                                  <span className="text-3xl block">🔍❌</span>
                                  <h4 className="font-extrabold text-rose-950 text-sm">ተማሪው አልተገኘም (Student Not Found)</h4>
                                  <p className="text-stone-500 text-xs leading-relaxed max-w-sm mx-auto">
                                    ያስገቡት መታወቂያ ቁጥር በስርዓቱ ውስጥ አልተገኘም።
                                  </p>
                                </div>
                              )}
                            </motion.div>
                          ) : (
                            <div className="text-center py-16 text-stone-400">
                              <p className="font-extrabold text-sm text-stone-600">እባክዎን ከላይ ካሉት ልጆችዎ አንዱን ይምረጡ</p>
                            </div>
                          )}
                        </AnimatePresence>
                      </div>

                      `;

  let blockToReplace = content.substring(startIdx, endIdx);
  content = content.replace(blockToReplace, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Successfully replaced parent search canvas block via fix32.js');
} else {
  console.log('Markers not found for fix32.js');
}
