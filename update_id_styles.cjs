const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const patches = [
  {
    target: `<span className="font-sans font-black text-[9.5px] uppercase tracking-wider text-amber-400 block text-center">
                                DILIGENT SCHOOL STUDENT ID CARD
                              </span>
                              <div className="w-1/3 border-t border-stone-800 my-1" />
                              <h4 className="text-[11px] font-black text-white tracking-wide text-center leading-tight">
                                የደሊጀነት ት/ቤት የተማሪዎች መታወቂያ ካርድ
                              </h4>
                              <p className="text-[7.5px] italic text-stone-400 font-medium mt-1 text-center">
                                {schoolConfig.mottoAmh || schoolConfig.mottoEng || 'ለመማር እንነሳ!'}
                              </p>`,
    repl: `<span className="font-sans font-black text-[10px] uppercase tracking-wider text-amber-300 block text-center">
                                DILIGENT SCHOOL STUDENT ID CARD
                              </span>
                              <div className="w-1/3 border-t border-stone-600 my-1.5" />
                              <h4 className="text-[12px] font-black text-white tracking-wide text-center leading-tight">
                                የደሊጀነት ት/ቤት የተማሪዎች መታወቂያ ካርድ
                              </h4>
                              <p className="text-[8.5px] italic text-amber-200 font-bold mt-1 text-center">
                                {schoolConfig.mottoAmh || schoolConfig.mottoEng || 'ለመማር እንነሳ!'}
                              </p>`
  },
  {
    target: `<span className="font-sans font-black text-[9.5px] uppercase tracking-wider text-amber-400 block text-center">
                          DILIGENT SCHOOL STUDENT ID CARD
                        </span>
                        <div className="w-1/3 border-t border-stone-800 my-1" />
                        <h4 className="text-[11px] font-black text-white tracking-wide text-center leading-tight">
                          የደሊጀነት ት/ቤት የተማሪዎች መታወቂያ ካርድ
                        </h4>
                        <p className="text-[7.5px] italic text-stone-400 font-medium mt-1 text-center">
                          {schoolConfig.mottoAmh || schoolConfig.mottoEng || 'ለመማር እንነሳ!'}
                        </p>`,
    repl: `<span className="font-sans font-black text-[10px] uppercase tracking-wider text-amber-300 block text-center">
                          DILIGENT SCHOOL STUDENT ID CARD
                        </span>
                        <div className="w-1/3 border-t border-stone-600 my-1.5" />
                        <h4 className="text-[12px] font-black text-white tracking-wide text-center leading-tight">
                          የደሊጀነት ት/ቤት የተማሪዎች መታወቂያ ካርድ
                        </h4>
                        <p className="text-[8.5px] italic text-amber-200 font-bold mt-1 text-center">
                          {schoolConfig.mottoAmh || schoolConfig.mottoEng || 'ለመማር እንነሳ!'}
                        </p>`
  },
  {
    target: `<div>
                              <h3 className="text-sm font-black text-white leading-tight">{student.name}</h3>
                              <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 font-extrabold text-[8px] rounded-full uppercase tracking-wider">
                                STUDENT (ተማሪ)
                              </span>
                            </div>`,
    repl: `<div>
                              <h3 className="text-[15px] font-black text-white leading-tight">{student.name}</h3>
                              <span className="inline-block mt-1 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 font-black text-[9px] rounded-full uppercase tracking-wider">
                                STUDENT (ተማሪ)
                              </span>
                            </div>`
  },
  {
    target: `<div>
                        <h3 className="text-sm font-black text-white leading-tight">{selectedQRStudent.name}</h3>
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 font-extrabold text-[8px] rounded-full uppercase tracking-wider">
                          STUDENT (ተማሪ)
                        </span>
                      </div>`,
    repl: `<div>
                        <h3 className="text-[15px] font-black text-white leading-tight">{selectedQRStudent.name}</h3>
                        <span className="inline-block mt-1 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 font-black text-[9px] rounded-full uppercase tracking-wider">
                          STUDENT (ተማሪ)
                        </span>
                      </div>`
  },
  {
    target: `<div className="grid grid-cols-2 gap-1.5 text-[9px] text-stone-300">
                              <div className="bg-black/30 border border-white/5 py-1 px-1.5 rounded-xl">
                                <span className="text-[7px] text-indigo-200 block uppercase font-bold">መታወቂያ (ID)</span>
                                <span className="font-mono font-black text-indigo-300">{student.id}</span>
                              </div>
                              <div className="bg-black/30 border border-white/5 py-1 px-1.5 rounded-xl">
                                <span className="text-[7px] text-indigo-200 block uppercase font-bold">ክፍል (Class)</span>
                                <span className="font-bold text-stone-200">{student.grade} - {student.section}</span>
                              </div>
                            </div>`,
    repl: `<div className="grid grid-cols-2 gap-2 text-[10px] text-stone-100">
                              <div className="bg-black/40 border border-white/10 py-1.5 px-2 rounded-xl">
                                <span className="text-[8px] text-amber-200 block uppercase font-bold">መታወቂያ (ID)</span>
                                <span className="font-mono font-black text-white text-xs">{student.id}</span>
                              </div>
                              <div className="bg-black/40 border border-white/10 py-1.5 px-2 rounded-xl">
                                <span className="text-[8px] text-amber-200 block uppercase font-bold">ክፍል (Class)</span>
                                <span className="font-bold text-white text-xs">{student.grade} - {student.section}</span>
                              </div>
                            </div>`
  },
  {
    target: `<div className="grid grid-cols-2 gap-1.5 text-[9px] text-stone-300">
                        <div className="bg-black/30 border border-white/5 py-1 px-1.5 rounded-xl">
                          <span className="text-[7px] text-indigo-200 block uppercase font-bold">መታወቂያ (ID)</span>
                          <span className="font-mono font-black text-indigo-300">{selectedQRStudent.id}</span>
                        </div>
                        <div className="bg-black/30 border border-white/5 py-1 px-1.5 rounded-xl">
                          <span className="text-[7px] text-indigo-200 block uppercase font-bold">ክፍል (Class)</span>
                          <span className="font-bold text-stone-200">{selectedQRStudent.grade} - {selectedQRStudent.section}</span>
                        </div>
                      </div>`,
    repl: `<div className="grid grid-cols-2 gap-2 text-[10px] text-stone-100">
                        <div className="bg-black/40 border border-white/10 py-1.5 px-2 rounded-xl">
                          <span className="text-[8px] text-amber-200 block uppercase font-bold">መታወቂያ (ID)</span>
                          <span className="font-mono font-black text-white text-xs">{selectedQRStudent.id}</span>
                        </div>
                        <div className="bg-black/40 border border-white/10 py-1.5 px-2 rounded-xl">
                          <span className="text-[8px] text-amber-200 block uppercase font-bold">ክፍል (Class)</span>
                          <span className="font-bold text-white text-xs">{selectedQRStudent.grade} - {selectedQRStudent.section}</span>
                        </div>
                      </div>`
  }
];

patches.forEach(p => {
  if (code.includes(p.target)) {
    code = code.replace(p.target, p.repl);
    console.log("Patched section.");
  } else {
    console.log("Failed to find target:\n" + p.target.slice(0, 100));
  }
});

fs.writeFileSync('src/App.tsx', code);
