const fs = require('fs');

const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetBlock = `                    {/* BACK CARD */}
                    <div className="w-[240px] h-[380px] shrink-0 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden border-4 border-indigo-600/20 shadow-2xl text-center select-none bg-white">
                      <div className="pt-3 z-10 flex flex-col items-center">
                         <p className="text-[9px] text-stone-500 font-black uppercase tracking-widest mb-0.5">Property of</p>
                         <h4 className="text-[13px] font-black text-stone-900 tracking-wide text-center">{(schoolConfig.nameEng || "DILIGENT SCHOOL").replace(/app/i, "").trim()}</h4>
                         <h4 className="text-[13px] font-black text-stone-900 tracking-wide text-center mt-0.5">{schoolConfig.nameAmh || "የደሊጀነት ት/ቤት"}</h4>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center space-y-4 my-auto z-10">
                         <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-stone-200 inline-block">
                           <img 
                             src={\`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=\${encodeURIComponent(selectedQRStudent.id)}\`} 
                             alt={\`QR code for \${selectedQRStudent.id}\`}
                             className="w-32 h-32"
                             referrerPolicy="no-referrer"
                           />
                         </div>

                         {selectedQRStudent.digitalId && (
                           <div className="bg-stone-100 border border-stone-200 py-1.5 px-6 rounded-xl text-center">
                             <span className="text-[8px] text-stone-500 block uppercase font-bold tracking-wider">ፋይዳ (FIN / FAN)</span>
                             <span className="font-mono font-black text-stone-900 text-sm tracking-widest">{selectedQRStudent.digitalId}</span>
                           </div>
                         )}
                      </div>

                      <div className="z-10 pb-2">
                         <p className="text-[9px] text-stone-600 leading-snug max-w-[210px] mx-auto font-bold text-center mb-5">
                           ይህ መታወቂያ በትምህርት ቤቱ መግቢያ በር ላይ ለሚገኘው የQR መግቢያ እና አቴንዳንስ መመዝገቢያ የሚያገለግል ነው።
                         </p>
                         <div className="flex flex-col items-center justify-center">
                           <div className="w-40 h-px border-t border-dashed border-stone-400 mb-1.5"></div>
                           <span className="text-[7.5px] text-stone-500 font-black uppercase tracking-widest">
                             የርዕሰ መምህር ፊርማ (Principal Signature)
                           </span>
                         </div>
                      </div>`;

const newBlock = `                    {/* BACK CARD */}
                    <div className="w-[240px] h-[380px] shrink-0 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden border-4 border-indigo-600/20 shadow-2xl text-center select-none bg-white">
                      <div className="pt-1 z-10 flex flex-col items-center">
                         <h4 className="text-[12px] font-black text-stone-900 tracking-wide text-center">{schoolConfig.nameAmh || "የደሊጀነት ት/ቤት"}</h4>
                      </div>
                      
                      {/* Details List */}
                      <div className="flex flex-col gap-[7px] mt-2 z-10 text-left px-2">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-stone-500 uppercase">የተማሪ ሙሉ ስም (Student Name)</span>
                            <span className="text-[11px] font-black text-stone-900 border-b border-stone-300 pb-0.5">{selectedQRStudent.name}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-stone-500 uppercase">የወላጅ ስልክ ቁጥር (Parent Phone)</span>
                            <span className="text-[11px] font-black text-stone-900 border-b border-stone-300 pb-0.5">{selectedQRStudent.parentPhone || '_____________________'}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-stone-500 uppercase">ቀበሌ / ወረዳ (Kebele / Woreda)</span>
                            <span className="text-[11px] font-black text-stone-900 border-b border-stone-300 pb-0.5">_____________________</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-stone-500 uppercase">የወላጅ ሙያ (Parent Occupation)</span>
                            <span className="text-[11px] font-black text-stone-900 border-b border-stone-300 pb-0.5">_____________________</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-stone-500 uppercase">አድራሻ (Address)</span>
                            <span className="text-[11px] font-black text-stone-900 border-b border-stone-300 pb-0.5">_____________________</span>
                         </div>
                      </div>
                      
                      <div className="flex justify-between items-center px-2 mt-auto pb-1 z-10">
                         {selectedQRStudent.digitalId && (
                           <div className="bg-stone-100 border border-stone-200 py-1 px-3 rounded-lg text-center flex-1 mr-2 flex flex-col justify-center">
                             <span className="text-[7px] text-stone-500 block uppercase font-bold tracking-wider">ፋይዳ</span>
                             <span className="font-mono font-black text-stone-900 text-[10px] tracking-widest">{selectedQRStudent.digitalId}</span>
                           </div>
                         )}
                         <div className="bg-white p-1.5 rounded-xl shadow-sm border border-stone-200 ml-auto flex-shrink-0">
                           <img 
                             src={\`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=\${encodeURIComponent(selectedQRStudent.id)}\`} 
                             alt={\`QR code for \${selectedQRStudent.id}\`}
                             className="w-[45px] h-[45px]"
                             referrerPolicy="no-referrer"
                           />
                         </div>
                      </div>
                      <div className="w-full flex justify-center pb-2 z-10 mt-1">
                         <div className="w-40 h-[1.5px] bg-stone-300 rounded-full"></div>
                      </div>`;

if (code.includes(targetBlock)) {
    fs.writeFileSync(file, code.replace(targetBlock, newBlock), 'utf8');
    console.log("Successfully replaced!");
} else {
    console.log("Target block not found. Checking if partial match exists...");
    // Fallback: simple line replacement if the exact text had whitespace differences
}
