const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const patches = [
  {
    target: `<div className="w-full border border-stone-800 bg-stone-950 rounded-xl p-1.5 shadow-md flex flex-col items-center justify-center">
                        <span className="font-sans font-black text-[9px] uppercase tracking-wider text-amber-400 block text-center">
                          {(schoolConfig.nameEng || "").replace(/app/i, "").trim()}
                        </span>
                        <div className="w-1/4 border-t border-stone-800 my-0.5" />
                        <h4 className="text-[10px] font-black text-white tracking-tight text-center">
                          {schoolConfig.nameAmh}
                        </h4>
                      </div>`,
    repl: `<div className="w-full border border-stone-800 bg-stone-950 rounded-xl p-1.5 shadow-md flex flex-col items-center justify-center">
                        <span className="font-sans font-black text-[10px] uppercase tracking-wider text-amber-300 block text-center">
                          DILIGENT SCHOOL
                        </span>
                        <div className="w-1/4 border-t border-stone-600 my-1" />
                        <h4 className="text-[11px] font-black text-white tracking-tight text-center">
                          የደሊጀነት ት/ቤት
                        </h4>
                      </div>`
  },
  {
    target: `<div className="text-left">
                        <h3 className="text-xs font-black text-white leading-tight">{selectedQRTeacher.name}</h3>
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 font-black text-[8px] rounded-full uppercase tracking-wider">
                          TEACHER (መምህር)
                        </span>
                      </div>`,
    repl: `<div className="text-left">
                        <h3 className="text-sm font-black text-white leading-tight">{selectedQRTeacher.name}</h3>
                        <span className="inline-block mt-1 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 font-black text-[9px] rounded-full uppercase tracking-wider">
                          TEACHER (መምህር)
                        </span>
                      </div>`
  },
  {
    target: `<div className="grid grid-cols-2 gap-1.5 text-[9px] text-stone-300">
                        <div className="bg-black/30 border border-white/5 py-1 px-1.5 rounded-xl">
                          <span className="text-[7px] text-stone-500 block uppercase font-bold">መምህር መለያ (ID)</span>
                          <span className="font-mono font-black text-indigo-300">{selectedQRTeacher.id}</span>
                        </div>
                        <div className="bg-black/30 border border-white/5 py-1 px-1.5 rounded-xl">
                          <span className="text-[7px] text-stone-500 block uppercase font-bold">ስልክ (Phone)</span>
                          <span className="font-bold text-stone-200 truncate block">{selectedQRTeacher.phone}</span>
                        </div>
                      </div>`,
    repl: `<div className="grid grid-cols-2 gap-2 text-[10px] text-stone-100">
                        <div className="bg-black/40 border border-white/10 py-1.5 px-2 rounded-xl">
                          <span className="text-[8px] text-amber-200 block uppercase font-bold">መምህር መለያ (ID)</span>
                          <span className="font-mono font-black text-white text-xs">{selectedQRTeacher.id}</span>
                        </div>
                        <div className="bg-black/40 border border-white/10 py-1.5 px-2 rounded-xl">
                          <span className="text-[8px] text-amber-200 block uppercase font-bold">ስልክ (Phone)</span>
                          <span className="font-bold text-white text-xs truncate block">{selectedQRTeacher.phone}</span>
                        </div>
                      </div>`
  },
  {
    target: `<p className="text-[7px] text-stone-500 leading-tight max-w-[220px] mx-auto">
                        ይህ መታወቂያ መምህራን በQR ስካነር በፍጥነት ወደ መምህር ገጻቸው ለመግባት የሚያገለግል ነው።
                      </p>
                      
                      <div className="mt-2 flex flex-col items-center justify-center">
                        <div className="w-24 h-px border-t border-dashed border-stone-600/40 mb-1"></div>
                        <span className="text-[6px] text-stone-500/70 font-bold uppercase tracking-widest">
                          የርዕሰ መምህር ፊርማ (Principal Signature)
                        </span>
                      </div>`,
    repl: `<p className="text-[8.5px] text-stone-400 font-bold leading-tight max-w-[220px] mx-auto">
                        ይህ መታወቂያ መምህራን በQR ስካነር በፍጥነት ወደ መምህር ገጻቸው ለመግባት የሚያገለግል ነው።
                      </p>
                      
                      <div className="mt-3 flex flex-col items-center justify-center">
                        <div className="w-32 h-px border-t border-dashed border-stone-500 mb-1.5"></div>
                        <span className="text-[7.5px] text-stone-400 font-black uppercase tracking-widest">
                          የርዕሰ መምህር ፊርማ (Principal Signature)
                        </span>
                      </div>`
  }
];

patches.forEach((p, i) => {
  if (code.includes(p.target)) {
    code = code.replace(p.target, p.repl);
    console.log("Patched teacher section " + i);
  } else {
    console.log("Failed to find teacher target " + i + ":\n" + p.target.slice(0, 100));
  }
});

fs.writeFileSync('src/App.tsx', code);
