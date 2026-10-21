const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

let target = `<span className="font-sans font-black text-[9px] uppercase tracking-wider text-amber-300 block text-center leading-none">
        {(schoolConfig.nameEng || "DILIGENT SCHOOL").replace(/app/i, "").trim()}
      </span>
      <h4 className="text-[12px] font-black text-white tracking-wide text-center leading-tight mt-1">
        {schoolConfig.nameAmh || "የደሊጀነት ት/ቤት"}
      </h4>`;
      
let replacement = `<h4 className="text-[12px] font-black text-white tracking-wide text-center leading-tight mt-0.5">
        {schoolConfig.nameAmh || "የደሊጀነት ት/ቤት"}
      </h4>
      <span className="font-sans font-black text-[8px] uppercase tracking-widest text-amber-300 block text-center leading-none mt-1">
        {(schoolConfig.nameEng || "DILIGENT SCHOOL").replace(/app/i, "").trim()}
      </span>
      <div className="text-[7px] font-black mt-1 text-indigo-50 text-center uppercase tracking-widest border-t border-indigo-400/40 pt-1 w-full mx-auto">
        የመምህራን መታወቂያ ካርድ<br/>TEACHER ID CARD
      </div>`;
      
code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
