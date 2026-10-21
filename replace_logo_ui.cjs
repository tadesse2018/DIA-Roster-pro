const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogoSection = `                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-2">🛡️ የትምህርት ቤት አርማ (School Logo / Icon):</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'graduation', label: 'Graduation Cap', icon: <GraduationCap className="w-4 h-4" /> },
                          { id: 'book', label: 'Open Book', icon: <BookOpen className="w-4 h-4" /> },
                          { id: 'shield', label: 'Academic Shield', icon: <ShieldCheck className="w-4 h-4" /> },
                          { id: 'award', label: 'Honors Award', icon: <Award className="w-4 h-4" /> }
                        ].map((logo) => (
                          <button
                            type="button"
                            key={logo.id}
                            onClick={() => { playInteractiveSound('click'); setWlLogoType(logo.id as any); }}
                            className={\`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 \${
                              wlLogoType === logo.id 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }\`}
                          >
                            {logo.icon}
                            <span>{logo.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>`;

const newLogoSection = `                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-2">🛡️ የትምህርት ቤት አርማ (School Logo):</label>
                      <div className="flex flex-col gap-2">
                        {wlLogoImage ? (
                          <div className="flex items-center gap-4 border p-2 rounded-xl bg-white w-max">
                            <img src={wlLogoImage} alt="School Logo" className="w-12 h-12 object-contain" />
                            <button
                              type="button"
                              onClick={() => { playInteractiveSound('click'); setWlLogoImage(''); }}
                              className="text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1 bg-rose-50 rounded-lg"
                            >
                              አጥፋ (Remove)
                            </button>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                playInteractiveSound('click');
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setWlLogoImage(reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl bg-white"
                          />
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">Logo will be used in reports and headers. (የተቋሙ አርማ በሪፖርቶች ላይ ይታያል)</p>
                      </div>
                    </div>`;

if (content.includes(oldLogoSection)) {
  content = content.replace(oldLogoSection, newLogoSection);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Successfully replaced logo selection UI.');
} else {
  console.error('Could not find old logo section.');
}
