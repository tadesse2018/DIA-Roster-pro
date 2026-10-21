const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogoSection = `                    <div>
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

const newLogoSection = `                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-2">🛡️ የትምህርት ቤት አርማ (School Logo):</label>
                      <div className="flex flex-col gap-3">
                        {wlLogoImage ? (
                          <div className="flex flex-col sm:flex-row items-center gap-4 border-2 border-dashed border-indigo-200 p-4 rounded-xl bg-indigo-50/50 w-full max-w-sm">
                            <div className="w-20 h-20 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden">
                              <img src={wlLogoImage} alt="School Logo Preview" className="w-16 h-16 object-contain" />
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className="text-sm font-bold text-slate-700">Logo Uploaded</span>
                              <button
                                type="button"
                                onClick={() => { playInteractiveSound('click'); setWlLogoImage(''); }}
                                className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-100 font-bold px-4 py-1.5 bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 justify-center"
                              >
                                <X className="w-3.5 h-3.5" /> አጥፋ (Remove & Change)
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50/30 transition-all w-full max-w-sm">
                            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-xs font-bold text-slate-600 mb-1">Click to upload school logo</p>
                            <p className="text-[10px] text-slate-400">PNG, JPG up to 2MB</p>
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
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" /> Logo will be used in reports and headers. (የተቋሙ አርማ በሪፖርቶች ላይ ይታያል)
                        </p>
                      </div>
                    </div>`;

if (content.includes(oldLogoSection)) {
  content = content.replace(oldLogoSection, newLogoSection);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Successfully enhanced logo preview UI.');
} else {
  console.error('Could not find old logo section.');
}
