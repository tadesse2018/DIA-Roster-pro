const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const patches = [
  {
    target: `<div className="pt-2 z-10 flex flex-col items-center">
                             <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mb-1">Property of</p>
                             <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">DILIGENT SCHOOL</h4>
                             <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">የደሊጀነት ት/ቤት</h4>
                          </div>`,
    repl: `<div className="pt-2 z-10 flex flex-col items-center">
                             <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-1">Property of</p>
                             <h4 className="text-[13px] font-black text-stone-900 tracking-wide text-center">DILIGENT SCHOOL</h4>
                             <h4 className="text-[13px] font-black text-stone-900 tracking-wide text-center mt-0.5">የደሊጀነት ት/ቤት</h4>
                          </div>`
  },
  {
    target: `<div className="pt-2 z-10 flex flex-col items-center">
                       <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mb-1">Property of</p>
                       <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">DILIGENT SCHOOL</h4>
                       <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">የደሊጀነት ት/ቤት</h4>
                    </div>`,
    repl: `<div className="pt-2 z-10 flex flex-col items-center">
                       <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-1">Property of</p>
                       <h4 className="text-[13px] font-black text-stone-900 tracking-wide text-center">DILIGENT SCHOOL</h4>
                       <h4 className="text-[13px] font-black text-stone-900 tracking-wide text-center mt-0.5">የደሊጀነት ት/ቤት</h4>
                    </div>`
  },
  {
    target: `<div className="bg-stone-200/50 border border-stone-300 py-1.5 px-6 rounded-xl text-center">
                                 <span className="text-[7.5px] text-stone-500 block uppercase font-black tracking-wider">ፋይዳ (FIN / FAN)</span>
                                 <span className="font-mono font-black text-stone-800 text-sm tracking-widest">{student.digitalId}</span>
                               </div>`,
    repl: `<div className="bg-stone-200/50 border border-stone-300 py-2 px-6 rounded-xl text-center">
                                 <span className="text-[9px] text-stone-600 block uppercase font-black tracking-wider">ፋይዳ (FIN / FAN)</span>
                                 <span className="font-mono font-black text-stone-900 text-base tracking-widest">{student.digitalId}</span>
                               </div>`
  },
  {
    target: `<div className="bg-stone-200/50 border border-stone-300 py-1.5 px-6 rounded-xl text-center">
                           <span className="text-[7.5px] text-stone-500 block uppercase font-black tracking-wider">ፋይዳ (FIN / FAN)</span>
                           <span className="font-mono font-black text-stone-800 text-sm tracking-widest">{selectedQRStudent.digitalId}</span>
                         </div>`,
    repl: `<div className="bg-stone-200/50 border border-stone-300 py-2 px-6 rounded-xl text-center">
                           <span className="text-[9px] text-stone-600 block uppercase font-black tracking-wider">ፋይዳ (FIN / FAN)</span>
                           <span className="font-mono font-black text-stone-900 text-base tracking-widest">{selectedQRStudent.digitalId}</span>
                         </div>`
  },
  {
    target: `<p className="text-[8px] text-stone-500 leading-snug max-w-[200px] mx-auto font-medium text-center mb-6">
                               ይህ መታወቂያ በትምህርት ቤቱ መግቢያ በር ላይ ለሚገኘው የQR መግቢያ እና አቴንዳንስ መመዝገቢያ የሚያገለግል ነው።
                             </p>
                             <div className="flex flex-col items-center justify-center">
                               <div className="w-32 h-px border-t border-dashed border-stone-400 mb-1"></div>
                               <span className="text-[6px] text-stone-500 font-bold uppercase tracking-widest">
                                 የርዕሰ መምህር ፊርማ (Principal Signature)
                               </span>
                             </div>`,
    repl: `<p className="text-[9.5px] text-stone-600 leading-snug max-w-[220px] mx-auto font-bold text-center mb-6">
                               ይህ መታወቂያ በትምህርት ቤቱ መግቢያ በር ላይ ለሚገኘው የQR መግቢያ እና አቴንዳንስ መመዝገቢያ የሚያገለግል ነው።
                             </p>
                             <div className="flex flex-col items-center justify-center">
                               <div className="w-40 h-px border-t border-dashed border-stone-400 mb-1.5"></div>
                               <span className="text-[8px] text-stone-600 font-black uppercase tracking-widest">
                                 የርዕሰ መምህር ፊርማ (Principal Signature)
                               </span>
                             </div>`
  },
  {
    target: `<p className="text-[8px] text-stone-500 leading-snug max-w-[200px] mx-auto font-medium text-center mb-6">
                         ይህ መታወቂያ በትምህርት ቤቱ መግቢያ በር ላይ ለሚገኘው የQR መግቢያ እና አቴንዳንስ መመዝገቢያ የሚያገለግል ነው።
                       </p>
                       <div className="flex flex-col items-center justify-center">
                         <div className="w-32 h-px border-t border-dashed border-stone-400 mb-1"></div>
                         <span className="text-[6px] text-stone-500 font-bold uppercase tracking-widest">
                           የርዕሰ መምህር ፊርማ (Principal Signature)
                         </span>
                       </div>`,
    repl: `<p className="text-[9.5px] text-stone-600 leading-snug max-w-[220px] mx-auto font-bold text-center mb-6">
                         ይህ መታወቂያ በትምህርት ቤቱ መግቢያ በር ላይ ለሚገኘው የQR መግቢያ እና አቴንዳንስ መመዝገቢያ የሚያገለግል ነው።
                       </p>
                       <div className="flex flex-col items-center justify-center">
                         <div className="w-40 h-px border-t border-dashed border-stone-400 mb-1.5"></div>
                         <span className="text-[8px] text-stone-600 font-black uppercase tracking-widest">
                           የርዕሰ መምህር ፊርማ (Principal Signature)
                         </span>
                       </div>`
  }
];

patches.forEach((p, i) => {
  if (code.includes(p.target)) {
    code = code.replace(p.target, p.repl);
    console.log("Patched back section " + i);
  } else {
    console.log("Failed to find back target " + i + ":\n" + p.target.slice(0, 100));
  }
});

fs.writeFileSync('src/App.tsx', code);
