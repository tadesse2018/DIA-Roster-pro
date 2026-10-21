const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

let oldHeader = `<span className="font-sans font-black text-[10px] uppercase tracking-wider text-amber-300 block text-center leading-none">{schoolConfig.nameEng || "DILIGENT SCHOOL"}</span>
                        <h4 className="text-[13px] font-black text-white tracking-wide text-center leading-tight mt-1">{schoolConfig.nameAmh || "የደሊጀነት ት/ቤት"}</h4>
                        <p className="text-[7.5px] italic text-indigo-100 font-bold mt-1.5 text-center">
                          {schoolConfig.mottoAmh || schoolConfig.mottoEng || 'ለመማር እንነሳ!'}
                        </p>`;

let newHeader = `<h4 className="text-[14px] font-black text-white tracking-wide text-center leading-tight">{schoolConfig.nameAmh || "የደሊጀነት ት/ቤት"}</h4>
                        <span className="font-sans font-black text-[9px] uppercase tracking-widest text-amber-300 block text-center leading-none mt-1">{schoolConfig.nameEng || "DILIGENT SCHOOL"}</span>
                        <div className="text-[7.5px] font-bold mt-1.5 text-indigo-100 text-center uppercase tracking-widest border-t border-indigo-400/30 pt-1 w-full mx-auto">
                          የተማሪዎች መታወቂያ ካርድ <br/> STUDENT ID CARD
                        </div>`;

code = code.split(oldHeader).join(newHeader);
fs.writeFileSync('src/App.tsx', code);
