const fs = require('fs');
let content = fs.readFileSync('src/components/GradeTrackerSection.tsx', 'utf8');

const targetForm = content.substring(
  content.indexOf('{/* Register Student Form */}'),
  content.indexOf('የወላጅ ኢሜል (Parent Email - Optional):</label>')
);

if (targetForm) {
  const newForm = `{/* Register Student Form */}
                <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-xs">
                  <div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">የክፍል ኃላፊ መምህር ተግባር</span>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                      <PlusCircle className="text-indigo-600 w-5 h-5" /> አዲስ ተማሪ ይመዝግቡ
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">Register a New Student and Assign Class/Section</p>
                  </div>

                  {regSuccessMsg && (
                    <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-semibold rounded-xl animate-pulse">
                      {regSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleRegisterStudent} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">የተማሪው ሙሉ ስም (Student Full Name):</label>
                      <input 
                        type="text"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="መላኩ ገብሬ"
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">ክፍል (Grade):</label>
                        <select 
                          value={newStudentGrade || (selectedGrade === 'All' ? (currentTeacher?.assignedClass || 'Grade 1') : selectedGrade)}
                          onChange={(e) => setNewStudentGrade(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-medium"
                        >
                          {(schoolConfig?.schoolLevel === 'secondary' 
                              ? ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] 
                              : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8']).map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">ሴክሽን (Sec):</label>
                        <select 
                          value={newStudentSection || (selectedSection === 'All' ? (currentTeacher?.assignedSection || 'A') : selectedSection)}
                          onChange={(e) => setNewStudentSection(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-medium"
                        >
                          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">ጾታ (Gender):</label>
                        <select 
                          value={newStudentGender}
                          onChange={(e) => setNewStudentGender(e.target.value as any)}
                          className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-medium"
                        >
                          <option value="Male">ወንድ (M)</option>
                          <option value="Female">ሴት (F)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">ዕድሜ (Age):</label>
                        <input 
                          type="number"
                          min="4"
                          max="25"
                          value={newStudentAge}
                          onChange={(e) => setNewStudentAge(e.target.value)}
                          placeholder="14"
                          className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-slate-50/50 font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <`;
  content = content.replace(targetForm, newForm);

  const stateSearch = `  const [newStudentAge, setNewStudentAge] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);`;
  const stateReplace = `  const [newStudentAge, setNewStudentAge] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStudentSection, setNewStudentSection] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setNewStudentGrade(selectedGrade === 'All' ? (currentTeacher?.assignedClass || 'Grade 1') : selectedGrade);
    setNewStudentSection(selectedSection === 'All' ? (currentTeacher?.assignedSection || 'A') : selectedSection);
  }, [selectedGrade, selectedSection, currentTeacher]);`;
  content = content.replace(stateSearch, stateReplace);

  const handlerSearch = `    const targetGrade = selectedGrade === 'All' ? (currentTeacher?.assignedClass || 'Grade 1') : selectedGrade;
    const targetSection = selectedSection === 'All' ? (currentTeacher?.assignedSection || 'A') : selectedSection;`;
  const handlerReplace = `    const targetGrade = newStudentGrade || (selectedGrade === 'All' ? (currentTeacher?.assignedClass || 'Grade 1') : selectedGrade);
    const targetSection = newStudentSection || (selectedSection === 'All' ? (currentTeacher?.assignedSection || 'A') : selectedSection);`;
  content = content.replace(handlerSearch, handlerReplace);

  const emailSearch = `                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">የወላጅ ኢሜል (Parent Email - Optional):</label>
                      <input 
                        type="email"
                        value={newStudentParentEmail}
                        onChange={(e) => setNewStudentParentEmail(e.target.value)}
                        placeholder="parent@email.com"
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white"
                      />
                    </div>`;
  const emailReplace = `                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">የወላጅ ኢሜል (Parent Email - Optional):</label>
                      <input 
                        type="email"
                        value={newStudentParentEmail}
                        onChange={(e) => setNewStudentParentEmail(e.target.value)}
                        placeholder="parent@email.com"
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-slate-50/50"
                      />
                    </div>`;
  content = content.replace(emailSearch, emailReplace);

  fs.writeFileSync('src/components/GradeTrackerSection.tsx', content, 'utf8');
  console.log('Successfully updated form UI and states.');
}
