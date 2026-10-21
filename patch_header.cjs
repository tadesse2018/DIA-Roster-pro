const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetHeader1 = `<div className="w-full border border-stone-800 bg-stone-950 rounded-2xl p-2 shadow-lg flex flex-col items-center justify-center relative">
                              <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none" />
                              <span className="font-sans font-black text-[9.5px] uppercase tracking-wider text-amber-400 block text-center">
                                {schoolConfig.nameEng}
                              </span>
                              <div className="w-1/3 border-t border-stone-800 my-1" />
                              <h4 className="text-[11px] font-black text-white tracking-wide text-center">
                                {schoolConfig.nameAmh}
                              </h4>
                              <p className="text-[10px] font-black text-amber-400 mt-1 mb-0.5 uppercase tracking-wider text-center">
                                የተማሪዎች መታወቂያ
                              </p>
                              <p className="text-[7.5px] italic text-stone-400 font-medium mt-0.5 text-center">
                                {schoolConfig.mottoAmh || schoolConfig.mottoEng || 'ለመማር እንነሳ!'}
                              </p>
                            </div>`;

const replHeader1 = `<div className="w-full border border-stone-800 bg-stone-950 rounded-2xl p-2 shadow-lg flex flex-col items-center justify-center relative">
                              <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none" />
                              <span className="font-sans font-black text-[9.5px] uppercase tracking-wider text-amber-400 block text-center">
                                {(schoolConfig.nameEng || '').replace(/app/i, '').trim()} STUDENT ID CARD
                              </span>
                              <div className="w-1/3 border-t border-stone-800 my-1" />
                              <h4 className="text-[11px] font-black text-white tracking-wide text-center leading-tight">
                                {(schoolConfig.nameAmh || '').replace(/አፕ/g, '').trim()} የተማሪዎች መታወቂያ ካርድ
                              </h4>
                              <p className="text-[7.5px] italic text-stone-400 font-medium mt-1 text-center">
                                {schoolConfig.mottoAmh || schoolConfig.mottoEng || 'ለመማር እንነሳ!'}
                              </p>
                            </div>`;

const targetHeader2 = `<div className="w-full border border-stone-800 bg-stone-950 rounded-2xl p-2 shadow-lg flex flex-col items-center justify-center relative">
                        {/* Decorative subtle border glow */}
                        <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none" />
                        <span className="font-sans font-black text-[9.5px] uppercase tracking-wider text-amber-400 block text-center">
                          {schoolConfig.nameEng}
                        </span>
                        <div className="w-1/3 border-t border-stone-800 my-1" />
                        <h4 className="text-[11px] font-black text-white tracking-wide text-center">
                          {schoolConfig.nameAmh}
                        </h4>
                        <p className="text-[10px] font-black text-amber-400 mt-1 mb-0.5 uppercase tracking-wider text-center">
                          የተማሪዎች መታወቂያ
                        </p>
                        <p className="text-[7.5px] italic text-stone-400 font-medium mt-0.5 text-center">
                          {schoolConfig.mottoAmh || schoolConfig.mottoEng || 'ለመማር እንነሳ!'}
                        </p>
                      </div>`;

const replHeader2 = `<div className="w-full border border-stone-800 bg-stone-950 rounded-2xl p-2 shadow-lg flex flex-col items-center justify-center relative">
                        {/* Decorative subtle border glow */}
                        <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none" />
                        <span className="font-sans font-black text-[9.5px] uppercase tracking-wider text-amber-400 block text-center">
                          {(schoolConfig.nameEng || '').replace(/app/i, '').trim()} STUDENT ID CARD
                        </span>
                        <div className="w-1/3 border-t border-stone-800 my-1" />
                        <h4 className="text-[11px] font-black text-white tracking-wide text-center leading-tight">
                          {(schoolConfig.nameAmh || '').replace(/አፕ/g, '').trim()} የተማሪዎች መታወቂያ ካርድ
                        </h4>
                        <p className="text-[7.5px] italic text-stone-400 font-medium mt-1 text-center">
                          {schoolConfig.mottoAmh || schoolConfig.mottoEng || 'ለመማር እንነሳ!'}
                        </p>
                      </div>`;

code = code.replace(targetHeader1, replHeader1);
code = code.replace(targetHeader2, replHeader2);
fs.writeFileSync('src/App.tsx', code);
console.log('patched header');
