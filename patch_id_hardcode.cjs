const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetHeader1 = `<span className="font-sans font-black text-[9.5px] uppercase tracking-wider text-amber-400 block text-center">
                                {(schoolConfig.nameEng || '').replace(/app/i, '').trim()} STUDENT ID CARD
                              </span>
                              <div className="w-1/3 border-t border-stone-800 my-1" />
                              <h4 className="text-[11px] font-black text-white tracking-wide text-center leading-tight">
                                {(schoolConfig.nameAmh || '').replace(/አፕ/g, '').trim()} የተማሪዎች መታወቂያ ካርድ
                              </h4>`;

const replHeader1 = `<span className="font-sans font-black text-[9.5px] uppercase tracking-wider text-amber-400 block text-center">
                                DILIGENT SCHOOL STUDENT ID CARD
                              </span>
                              <div className="w-1/3 border-t border-stone-800 my-1" />
                              <h4 className="text-[11px] font-black text-white tracking-wide text-center leading-tight">
                                የደሊጀነት ት/ቤት የተማሪዎች መታወቂያ ካርድ
                              </h4>`;

const targetHeader2 = `<span className="font-sans font-black text-[9.5px] uppercase tracking-wider text-amber-400 block text-center">
                          {(schoolConfig.nameEng || '').replace(/app/i, '').trim()} STUDENT ID CARD
                        </span>
                        <div className="w-1/3 border-t border-stone-800 my-1" />
                        <h4 className="text-[11px] font-black text-white tracking-wide text-center leading-tight">
                          {(schoolConfig.nameAmh || '').replace(/አፕ/g, '').trim()} የተማሪዎች መታወቂያ ካርድ
                        </h4>`;

const replHeader2 = `<span className="font-sans font-black text-[9.5px] uppercase tracking-wider text-amber-400 block text-center">
                          DILIGENT SCHOOL STUDENT ID CARD
                        </span>
                        <div className="w-1/3 border-t border-stone-800 my-1" />
                        <h4 className="text-[11px] font-black text-white tracking-wide text-center leading-tight">
                          የደሊጀነት ት/ቤት የተማሪዎች መታወቂያ ካርድ
                        </h4>`;

const targetBack1 = `<div className="pt-2 z-10 flex flex-col items-center">
                             <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mb-1">Property of</p>
                             <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">{(schoolConfig.nameEng || "").replace(/app/i, "").trim()}</h4>
                             <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">{schoolConfig.nameAmh}</h4>
                          </div>`;

const replBack1 = `<div className="pt-2 z-10 flex flex-col items-center">
                             <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mb-1">Property of</p>
                             <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">DILIGENT SCHOOL</h4>
                             <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">የደሊጀነት ት/ቤት</h4>
                          </div>`;

const targetBack2 = `<div className="pt-2 z-10 flex flex-col items-center">
                       <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mb-1">Property of</p>
                       <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">{(schoolConfig.nameEng || "").replace(/app/i, "").trim()}</h4>
                       <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">{schoolConfig.nameAmh}</h4>
                    </div>`;

const replBack2 = `<div className="pt-2 z-10 flex flex-col items-center">
                       <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mb-1">Property of</p>
                       <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">DILIGENT SCHOOL</h4>
                       <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">የደሊጀነት ት/ቤት</h4>
                    </div>`;

if (code.includes(targetHeader1)) code = code.replace(targetHeader1, replHeader1);
if (code.includes(targetHeader2)) code = code.replace(targetHeader2, replHeader2);
if (code.includes(targetBack1)) code = code.replace(targetBack1, replBack1);
if (code.includes(targetBack2)) code = code.replace(targetBack2, replBack2);

fs.writeFileSync('src/App.tsx', code);
console.log('patched explicit ID text');
